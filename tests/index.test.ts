import { expect, test } from 'vitest'
import { BrowserRunner } from '../src/runner/browser'
import { Analyzer } from '../src/core/analyzer'

test('exports BrowserRunner class', () => {
  expect(typeof BrowserRunner).toBe('function')
})

test('exports Analyzer class', () => {
  expect(typeof Analyzer).toBe('function')
})

test('can create BrowserRunner instance', () => {
  const runner = new BrowserRunner()
  expect(runner).toBeInstanceOf(BrowserRunner)
})
