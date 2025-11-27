/**
 * E2E Testing API for interaxtion
 *
 * This module provides a unified, driver-agnostic API for running
 * interaxtion accessibility analysis in E2E tests.
 *
 * @example
 * ```typescript
 * import { analyze } from 'interaxtion/e2e'
 * import { test, expect } from '@playwright/test'
 *
 * test('page is accessible', async ({ page }) => {
 *   await page.goto('https://example.com')
 *   const results = await analyze(page)
 *   expect(results.summary.errors).toBe(0)
 * })
 * ```
 */

import { detectDriver, type E2EPage, type SupportedDriver } from './driver-detect'
import { injectBundle, isBundleLoaded } from './inject'

export type { E2EPage, SupportedDriver } from './driver-detect'

/**
 * Analysis options
 */
export interface AnalyzeOptions {
  /**
   * Only analyze specific patterns (e.g., ['dialog', 'menu'])
   */
  patterns?: string[]

  /**
   * Minimum confidence level for pattern detection
   */
  minConfidence?: 'low' | 'medium' | 'high'

  /**
   * Include fix suggestions in results
   */
  includeSuggestions?: boolean

  /**
   * Analyze a specific element instead of the whole page
   */
  selector?: string
}

/**
 * Analysis results
 */
export interface AnalysisResults {
  summary: {
    patternsFound: number
    errors: number
    warnings: number
    info: number
  }
  patterns: Array<{
    type: string
    confidence: string
    detectionMethod: string
    element: unknown
    issues: Array<{
      severity: 'error' | 'warning' | 'info'
      message: string
      suggestion?: string
      ruleId: string
      element: unknown
    }>
    relatedElements: {
      triggers: unknown[]
      closeButtons: unknown[]
      backdrop: unknown | null
      focusableElements: unknown[]
    }
    metadata: Record<string, unknown>
  }>
}

// Track which pages have been injected to avoid double-injection
const injectedPages = new WeakSet<object>()

/**
 * Run interaxtion analysis on an E2E page
 *
 * This function automatically:
 * - Detects your E2E driver (Playwright, Puppeteer, WebDriverIO)
 * - Injects the interaxtion browser bundle (only once per page)
 * - Runs the accessibility analysis
 * - Returns structured results
 *
 * @param page - The E2E page object (Playwright, Puppeteer, or WebDriverIO)
 * @param options - Analysis options
 * @returns Analysis results with patterns and issues
 *
 * @example
 * ```typescript
 * // Basic usage
 * const results = await analyze(page)
 * expect(results.summary.errors).toBe(0)
 *
 * // With options
 * const results = await analyze(page, {
 *   patterns: ['dialog'],
 *   minConfidence: 'high',
 *   selector: '#my-dialog'
 * })
 * ```
 */
export async function analyze(
  page: E2EPage,
  options: AnalyzeOptions = {}
): Promise<AnalysisResults> {
  const driver = detectDriver(page)

  // Always check if bundle is actually loaded in the page
  // The page context resets on navigation (page.goto()), so we can't rely on WeakSet alone
  if (!(await isBundleLoaded(page))) {
    await injectBundle(page, driver)
    injectedPages.add(page)
  }

  // Build config from options
  const config = {
    patterns: options.patterns,
    minConfidence: options.minConfidence,
    includeSuggestions: options.includeSuggestions ?? true,
  }
  const selector = options.selector

  // Run analysis in browser context
  return page.evaluate(
    ({ config, selector }) => {
      const interaxtion = (
        window as unknown as {
          interaxtion: {
            BrowserRunner: new (config?: unknown) => {
              run: () => Promise<unknown>
              runOnElement: (el: Element) => Promise<unknown>
            }
          }
        }
      ).interaxtion

      if (!interaxtion?.BrowserRunner) {
        throw new Error('interaxtion browser bundle not loaded')
      }

      const runner = new interaxtion.BrowserRunner({ analyzerConfig: config })

      if (selector) {
        const element = document.querySelector(selector)
        if (!element) {
          throw new Error(`Element not found: ${selector}`)
        }
        return runner.runOnElement(element)
      }

      return runner.run()
    },
    { config, selector }
  ) as Promise<AnalysisResults>
}

/**
 * Convenience function to check if a page has accessibility errors
 *
 * @param page - The E2E page object
 * @param options - Analysis options
 * @returns true if errors were found, false otherwise
 *
 * @example
 * ```typescript
 * if (await hasErrors(page)) {
 *   console.log('Accessibility issues found!')
 * }
 * ```
 */
export async function hasErrors(page: E2EPage, options?: AnalyzeOptions): Promise<boolean> {
  const results = await analyze(page, options)
  return results.summary.errors > 0
}

/**
 * Convenience function to get error count
 *
 * @param page - The E2E page object
 * @param options - Analysis options
 * @returns The number of errors found
 *
 * @example
 * ```typescript
 * const errors = await getErrorCount(page)
 * console.log(`Found ${errors} accessibility errors`)
 * ```
 */
export async function getErrorCount(page: E2EPage, options?: AnalyzeOptions): Promise<number> {
  const results = await analyze(page, options)
  return results.summary.errors
}

/**
 * Convenience function to get warning count
 *
 * @param page - The E2E page object
 * @param options - Analysis options
 * @returns The number of warnings found
 */
export async function getWarningCount(page: E2EPage, options?: AnalyzeOptions): Promise<number> {
  const results = await analyze(page, options)
  return results.summary.warnings
}

/**
 * Convenience function to get total issue count (errors + warnings)
 *
 * @param page - The E2E page object
 * @param options - Analysis options
 * @returns The total number of issues found
 */
export async function getIssueCount(page: E2EPage, options?: AnalyzeOptions): Promise<number> {
  const results = await analyze(page, options)
  return results.summary.errors + results.summary.warnings
}
