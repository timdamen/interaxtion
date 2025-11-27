/**
 * Core type definitions for ARIA pattern validation
 */

/**
 * Severity level of an issue
 */
export type Severity = 'error' | 'warning' | 'info'

/**
 * Confidence level of pattern detection
 */
export type Confidence = 'high' | 'medium' | 'low'

/**
 * Method used to detect the pattern
 */
export type DetectionMethod = 
  | 'explicit-role'      // Has explicit ARIA role
  | 'native-element'     // Native HTML element
  | 'heuristic'          // Detected by pattern matching

/**
 * Issue found during validation
 */
export interface Issue {
  /** Severity of the issue */
  severity: Severity
  /** Human-readable description */
  message: string
  /** Optional suggestion for fixing */
  suggestion?: string
  /** Rule ID that triggered this issue */
  ruleId: string
  /** Element that has the issue (for browser context) */
  element?: Element
}

/**
 * Base pattern interface
 */
export interface Pattern {
  /** Type of pattern (dialog, combobox, tabs, etc.) */
  type: string
  /** Confidence level of detection */
  confidence: Confidence
  /** How the pattern was detected */
  detectionMethod: DetectionMethod
  /** The main element of the pattern */
  element: Element
  /** Issues found during validation */
  issues: Issue[]
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  /** Summary statistics */
  summary: {
    patternsFound: number
    errors: number
    warnings: number
    info: number
  }
  /** Detected patterns */
  patterns: Pattern[]
}

/**
 * Configuration options for the analyzer
 */
export interface AnalyzerConfig {
  /** Minimum confidence level to report */
  minConfidence?: Confidence
  /** Which patterns to detect (empty = all) */
  patterns?: string[]
  /** Include suggestions in issues */
  includeSuggestions?: boolean
}

/**
 * Runner configuration
 */
export interface RunnerConfig {
  /** Analyzer configuration */
  analyzerConfig?: AnalyzerConfig
  /** Callback when scan state changes */
  onScanStateChange?: (isRunning: boolean) => void
}