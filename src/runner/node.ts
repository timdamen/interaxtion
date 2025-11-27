import { JSDOM } from 'jsdom'
import type { AnalysisResult, RunnerConfig } from '../core/types'
import { Analyzer } from '../core/analyzer'

/**
 * Node.js runner using JSDOM
 * For testing and server-side validation
 */
export class NodeRunner {
  private config: RunnerConfig
  private isScanRunning = false

  constructor(config: RunnerConfig = {}) {
    this.config = config
  }

  /**
   * Analyze HTML string
   */
  async analyzeHTML(html: string): Promise<AnalysisResult> {
    if (this.isScanRunning) {
      return this.emptyResult()
    }

    this.isScanRunning = true
    this.config.onScanStateChange?.(true)

    try {
      // Create JSDOM instance
      const dom = new JSDOM(html, {
        url: 'http://localhost',
        contentType: 'text/html',
        pretendToBeVisual: true,
        runScripts: 'outside-only',
      })

      const { window } = dom
      const { document } = window

      // Run analyzer
      const analyzer = new Analyzer(document, this.config.analyzerConfig)
      const result = analyzer.analyze()

      // Cleanup
      window.close()

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
   * Analyze a URL
   */
  async analyzeURL(url: string): Promise<AnalysisResult> {
    if (this.isScanRunning) {
      return this.emptyResult()
    }

    this.isScanRunning = true
    this.config.onScanStateChange?.(true)

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      const dom = new JSDOM(html, {
        url: url,
        contentType: 'text/html',
        pretendToBeVisual: true,
        runScripts: 'outside-only',
      })

      const { window } = dom
      const { document } = window

      const analyzer = new Analyzer(document, this.config.analyzerConfig)
      const result = analyzer.analyze()

      window.close()

      return result
    } catch (error) {
      console.error('Failed to analyze URL:', error)
      return this.emptyResult()
    } finally {
      this.isScanRunning = false
      this.config.onScanStateChange?.(false)
    }
  }

  /**
   * Analyze HTML file from filesystem
   */
  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      const html = await fs.readFile(filePath, 'utf-8')
      const absolutePath = path.resolve(filePath)
      const fileUrl = `file://${absolutePath}`

      const dom = new JSDOM(html, {
        url: fileUrl,
        contentType: 'text/html',
        pretendToBeVisual: true,
        runScripts: 'outside-only',
      })

      const { window } = dom
      const { document } = window

      const analyzer = new Analyzer(document, this.config.analyzerConfig)
      const result = analyzer.analyze()

      window.close()

      return result
    } catch (error) {
      console.error('Failed to analyze file:', error)
      return this.emptyResult()
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