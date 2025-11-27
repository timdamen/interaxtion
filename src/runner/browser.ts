import type { AnalysisResult, RunnerConfig } from '../core/types'
import { Analyzer } from '../core/analyzer'

/**
 * Browser runner that analyzes the current document
 * Framework-agnostic - works in any JavaScript environment
 */
export class BrowserRunner {
  private config: RunnerConfig
  private isScanRunning = false

  constructor(config: RunnerConfig = {}) {
    this.config = config
  }

  /**
   * Analyze the current document
   * Can be called from browser console, dev tools, or framework code
   */
  async run(): Promise<AnalysisResult> {
    if (this.isScanRunning) {
      return this.emptyResult()
    }

    this.isScanRunning = true
    this.config.onScanStateChange?.(true)

    // Track start time for minimum duration (prevents UI flicker)
    const startTime = Date.now()
    const MIN_SCAN_DURATION = 500 // 500ms

    try {
      // Use the actual browser document
      const analyzer = new Analyzer(document, this.config.analyzerConfig)
      const result = analyzer.analyze()

      // Ensure minimum scan duration
      const elapsed = Date.now() - startTime
      if (elapsed < MIN_SCAN_DURATION) {
        await new Promise(resolve =>
          setTimeout(resolve, MIN_SCAN_DURATION - elapsed)
        )
      }

      return result
    } catch (error) {
      console.error('Analysis failed:', error)
      return this.emptyResult()
    } finally {
      this.isScanRunning = false
      this.config.onScanStateChange?.(false)
    }
  }

  /**
   * Analyze a specific element and its children
   */
  async runOnElement(element: Element): Promise<AnalysisResult> {
    if (this.isScanRunning) {
      return this.emptyResult()
    }

    this.isScanRunning = true
    this.config.onScanStateChange?.(true)

    try {
      // Create a temporary document fragment containing just this element
      // For simplicity, we'll just use the element's ownerDocument
      // but filter results to only those within the element
      const analyzer = new Analyzer(
        element.ownerDocument!,
        this.config.analyzerConfig
      )
      const fullResult = analyzer.analyze()

      // Filter patterns to only those within the target element
      const filteredPatterns = fullResult.patterns.filter(pattern =>
        element.contains(pattern.element)
      )

      // Recalculate summary
      let errors = 0
      let warnings = 0
      let info = 0

      filteredPatterns.forEach(pattern => {
        pattern.issues.forEach(issue => {
          if (issue.severity === 'error') errors++
          if (issue.severity === 'warning') warnings++
          if (issue.severity === 'info') info++
        })
      })

      return {
        summary: {
          patternsFound: filteredPatterns.length,
          errors,
          warnings,
          info,
        },
        patterns: filteredPatterns,
      }
    } finally {
      this.isScanRunning = false
      this.config.onScanStateChange?.(false)
    }
  }

  private emptyResult(): AnalysisResult {
    return {
      summary: {
        patternsFound: 0,
        errors: 0,
        warnings: 0,
        info: 0,
      },
      patterns: [],
    }
  }
}