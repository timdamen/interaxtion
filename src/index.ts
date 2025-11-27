/**
 * aria-patterns - Framework-agnostic ARIA pattern validation
 * 
 * Usage in Browser:
 *   import { createRunner } from 'aria-patterns'
 *   const runner = createRunner({ ... })
 *   const results = await runner.run()
 * 
 * Usage in Node.js:
 *   import { analyzeHTML } from 'aria-patterns'
 *   const results = await analyzeHTML('<div role="dialog">...</div>')
 */

// Runners
export { BrowserRunner } from './runner/browser'
export { NodeRunner } from './runner/node'

// Core
export { Analyzer } from './core/analyzer'

// Types
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

// Utilities
export * from './common/aria'
export * from './common/dom'

/**
 * Create a browser runner (framework-agnostic)
 * Works in vanilla JS, React, Vue, Svelte, Angular, etc.
 */
export function createRunner(config?: import('./core/types').RunnerConfig) {
  const { BrowserRunner } = require('./runner/browser')
  return new BrowserRunner(config)
}

/**
 * Quick API for Node.js - analyze HTML string
 */
export async function analyzeHTML(
  html: string,
  config?: import('./core/types').RunnerConfig
): Promise<import('./core/types').AnalysisResult> {
  const { NodeRunner } = await import('./runner/node')
  const runner = new NodeRunner(config)
  return runner.analyzeHTML(html)
}

/**
 * Quick API for Node.js - analyze URL
 */
export async function analyzeURL(
  url: string,
  config?: import('./core/types').RunnerConfig
): Promise<import('./core/types').AnalysisResult> {
  const { NodeRunner } = await import('./runner/node')
  const runner = new NodeRunner(config)
  return runner.analyzeURL(url)
}