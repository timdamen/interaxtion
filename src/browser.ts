/**
 * Browser-only bundle entry point
 *
 * This file is bundled into a standalone IIFE (Immediately Invoked Function Expression)
 * that can be loaded directly in browsers via script tags or Playwright's addScriptTag.
 *
 * Key differences from main entry (src/index.ts):
 * - Does NOT export NodeRunner (which requires JSDOM)
 * - Only exports browser-compatible APIs
 * - Bundled as a single file with no external dependencies
 *
 * Usage in Playwright:
 * ```typescript
 * await page.addScriptTag({ path: 'node_modules/interaxtion/dist/browser.js' })
 * const result = await page.evaluate(() => {
 *   const runner = new window.interaxtion.BrowserRunner()
 *   return runner.run()
 * })
 * ```
 */

// Export browser-only runner
export { BrowserRunner } from './runner/browser'

// Export core analyzer (browser-compatible)
export { Analyzer } from './core/analyzer'

// Export types
export type {
  AnalysisResult,
  AnalyzerConfig,
  RunnerConfig,
  Pattern,
  Issue,
  Severity,
  Confidence,
  DetectionMethod,
} from './core/types'

export type {
  DialogPattern,
  DialogRule,
} from './patterns/dialog/types'

// Export utilities (browser-compatible)
export * from './common/aria'
export * from './common/dom'

/**
 * Create a browser runner (convenience factory)
 */
export function createRunner(config?: import('./core/types').RunnerConfig) {
  const { BrowserRunner } = require('./runner/browser')
  return new BrowserRunner(config)
}
