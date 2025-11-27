/**
 * Driver detection and type definitions for E2E testing
 */

/**
 * Supported E2E test drivers
 */
export type SupportedDriver = 'playwright' | 'puppeteer' | 'webdriverio' | 'unknown'

/**
 * Generic E2E page interface that covers common methods
 * across Playwright, Puppeteer, and WebDriverIO
 */
export interface E2EPage {
  evaluate: <R = unknown, Args = unknown>(
    pageFunction: ((arg: Args) => R | Promise<R>) | string,
    arg?: Args
  ) => Promise<R>
  addScriptTag?: (options: { path?: string; content?: string; url?: string }) => Promise<unknown>
  [key: string]: unknown
}

/**
 * Detect which E2E driver is being used
 *
 * This checks for driver-specific properties/methods to determine
 * which test framework we're working with.
 */
export function detectDriver(page: E2EPage): SupportedDriver {
  // Check for Playwright-specific properties
  if ('context' in page && typeof page.context === 'function') {
    return 'playwright'
  }

  // Check for Puppeteer-specific properties
  if ('browser' in page && typeof page.browser === 'function') {
    return 'puppeteer'
  }

  // Check for WebDriverIO-specific properties
  if ('execute' in page && typeof page.execute === 'function') {
    return 'webdriverio'
  }

  // Unknown driver - will try generic approach
  return 'unknown'
}

/**
 * Get the path to the browser bundle
 */
export async function getBrowserBundlePath(): Promise<string> {
  // This will be resolved at runtime in the consuming project
  try {
    // Use dynamic import.meta.resolve when available (Node 20.6+)
    if (typeof import.meta.resolve === 'function') {
      const resolved = import.meta.resolve('interaxtion/browser')
      // Convert file:// URL to path
      return resolved.replace(/^file:\/\//, '')
    }
  } catch {
    // Fall through to require.resolve
  }

  // Fallback to require.resolve
  const { createRequire } = await import('node:module')
  const { dirname, join } = await import('node:path')

  const require = createRequire(import.meta.url)
  const interaxtionPath = require.resolve('interaxtion')
  return join(dirname(interaxtionPath), 'browser.js')
}

/**
 * Get the browser bundle content as a string
 * Useful for drivers that prefer inline scripts
 */
export async function getBrowserBundleContent(): Promise<string> {
  const { readFileSync } = await import('node:fs')
  const path = await getBrowserBundlePath()
  return readFileSync(path, 'utf-8')
}
