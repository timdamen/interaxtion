import type { AnalysisResult, AnalyzerConfig, Pattern } from './types'
import { DialogDetector } from '../patterns/dialog/detector'
import { DialogValidator } from '../patterns/dialog/validator'
import type { DialogPattern } from '../patterns/dialog/types'

/**
 * Main analyzer that coordinates pattern detection and validation
 */
export class Analyzer {
  private config: Required<AnalyzerConfig>

  constructor(
    private document: Document,
    config: AnalyzerConfig = {}
  ) {
    // Set defaults
    this.config = {
      minConfidence: config.minConfidence || 'low',
      patterns: config.patterns || [],
      includeSuggestions: config.includeSuggestions ?? true,
    }
  }

  /**
   * Run analysis on the document
   */
  analyze(): AnalysisResult {
    const patterns: Pattern[] = []

    // Detect and validate dialog patterns
    if (this.shouldAnalyzePattern('dialog')) {
      patterns.push(...this.analyzeDialogs())
    }

    // Filter by confidence level
    const filteredPatterns = this.filterByConfidence(patterns)

    // Calculate summary
    const summary = this.calculateSummary(filteredPatterns)

    return {
      summary,
      patterns: filteredPatterns,
    }
  }

  /**
   * Detect and validate dialog patterns
   */
  private analyzeDialogs(): DialogPattern[] {
    const detector = new DialogDetector(this.document)
    const validator = new DialogValidator()

    const dialogs = detector.detectAll()

    // Validate each dialog
    for (const dialog of dialogs) {
      dialog.issues = validator.validate(dialog)

      // Remove suggestions if not requested
      if (!this.config.includeSuggestions) {
        dialog.issues.forEach(issue => {
          delete issue.suggestion
        })
      }
    }

    return dialogs
  }

  /**
   * Check if pattern should be analyzed
   */
  private shouldAnalyzePattern(patternType: string): boolean {
    // If no patterns specified, analyze all
    if (this.config.patterns.length === 0) {
      return true
    }

    return this.config.patterns.includes(patternType)
  }

  /**
   * Filter patterns by confidence level
   */
  private filterByConfidence(patterns: Pattern[]): Pattern[] {
    const confidenceLevels = {
      high: 3,
      medium: 2,
      low: 1,
    }

    const threshold = confidenceLevels[this.config.minConfidence]

    return patterns.filter(
      pattern => confidenceLevels[pattern.confidence] >= threshold
    )
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(patterns: Pattern[]) {
    let errors = 0
    let warnings = 0
    let info = 0

    for (const pattern of patterns) {
      for (const issue of pattern.issues) {
        switch (issue.severity) {
          case 'error':
            errors++
            break
          case 'warning':
            warnings++
            break
          case 'info':
            info++
            break
        }
      }
    }

    return {
      patternsFound: patterns.length,
      errors,
      warnings,
      info,
    }
  }
}