# Interaxtion

> Framework-agnostic ARIA pattern analyzer for automated accessibility testing

Interaxtion is an accessibility testing library that analyzes interactive ARIA patterns (like dialogs, modals, and more) in your web applications. Think of it like [axe-core](https://github.com/dequelabs/axe-core), but specifically focused on interactive UI patterns and their proper implementation.

## Features

- 🎯 **Framework-agnostic** - Works with React, Vue, Svelte, Angular, vanilla JS, or any framework
- 🧪 **Test-ready** - Integrates seamlessly with Vitest, Playwright, Jest, and other testing frameworks
- 🌐 **Browser & Node.js** - Run tests in real browsers or Node.js environments
- 📋 **Pattern detection** - Automatically finds and validates ARIA patterns in your UI
- ✅ **WCAG compliance** - Validates against accessibility best practices
- 🔍 **Detailed reporting** - Get actionable feedback with suggestions for fixes

## Installation

```bash
npm install interaxtion
```

```bash
pnpm add interaxtion
```

```bash
yarn add interaxtion
```

## Usage

### Browser-Based Testing (Vitest Browser Mode, Playwright, Cypress)

Use `BrowserRunner` to analyze the actual rendered DOM in browser tests:

```typescript
import { BrowserRunner } from 'interaxtion'
import { test, expect } from 'vitest'

test('dialog is accessible', async () => {
  // Render your component
  document.body.innerHTML = `
    <button aria-controls="my-dialog">Open Dialog</button>
    <div id="my-dialog" role="dialog" aria-labelledby="dialog-title" aria-modal="true" hidden>
      <h2 id="dialog-title">Confirm Action</h2>
      <p>Are you sure?</p>
      <button aria-label="Close">×</button>
    </div>
  `

  // Analyze with Interaxtion
  const runner = new BrowserRunner()
  const results = await runner.run()

  // Assert no accessibility errors
  expect(results.summary.errors).toBe(0)
  expect(results.summary.patternsFound).toBeGreaterThan(0)
})
```

### Node.js Testing (Jest, Vitest Node Mode)

Use `analyzeHTML` for server-side or JSDOM-based testing:

```typescript
import { analyzeHTML } from 'interaxtion'
import { test, expect } from 'vitest'

test('dialog HTML is accessible', async () => {
  const html = `
    <div role="dialog" aria-label="Settings" hidden>
      <button aria-label="Close">×</button>
      <form>...</form>
    </div>
  `

  const results = await analyzeHTML(html)

  expect(results.summary.errors).toBe(0)
})
```

### Framework Examples

#### React with Testing Library

```typescript
import { render } from '@testing-library/react'
import { BrowserRunner } from 'interaxtion'
import { MyDialog } from './MyDialog'

test('MyDialog component is accessible', async () => {
  render(<MyDialog />)

  const runner = new BrowserRunner()
  const results = await runner.run()

  expect(results.summary.errors).toBe(0)
})
```

#### Vue Test Utils

```typescript
import { mount } from '@vue/test-utils'
import { BrowserRunner } from 'interaxtion'
import MyDialog from './MyDialog.vue'

test('MyDialog component is accessible', async () => {
  mount(MyDialog)

  const runner = new BrowserRunner()
  const results = await runner.run()

  expect(results.summary.errors).toBe(0)
})
```

#### Playwright

```typescript
import { test, expect } from '@playwright/test'
import { analyzeHTML } from 'interaxtion'

test('page dialogs are accessible', async ({ page }) => {
  await page.goto('https://example.com')

  const html = await page.content()
  const results = await analyzeHTML(html)

  expect(results.summary.errors).toBe(0)
})
```

## API

### BrowserRunner

For browser-based testing environments.

```typescript
import { BrowserRunner } from 'interaxtion'

const runner = new BrowserRunner({
  analyzerConfig: {
    patterns: ['dialog'], // Optional: only analyze specific patterns
    minConfidence: 'medium', // Optional: filter by confidence level
    includeSuggestions: true, // Optional: include fix suggestions
  },
})

// Analyze the entire document
const results = await runner.run()

// Analyze a specific element
const element = document.querySelector('#my-component')
const results = await runner.runOnElement(element)
```

### analyzeHTML

For Node.js environments (uses JSDOM internally).

```typescript
import { analyzeHTML } from 'interaxtion'

const results = await analyzeHTML('<div role="dialog">...</div>', {
  analyzerConfig: {
    patterns: ['dialog'],
    minConfidence: 'high',
  },
})
```

### Results Structure

```typescript
{
  summary: {
    patternsFound: 1,
    errors: 0,
    warnings: 1,
    info: 0
  },
  patterns: [
    {
      type: 'dialog',
      element: HTMLElement,
      confidence: 'high',
      detectionMethod: 'explicit-role',
      issues: [
        {
          ruleId: 'dialog-accessible-name',
          severity: 'error',
          message: 'Dialog must have an accessible name',
          suggestion: 'Add aria-label or aria-labelledby attribute',
          element: HTMLElement
        }
      ],
      relatedElements: {
        triggers: [...],
        closeButtons: [...]
      }
    }
  ]
}
```

## Supported Patterns

- ✅ Dialog / Modal
- 🚧 Dropdown Menu (coming soon)
- 🚧 Tabs (coming soon)
- 🚧 Accordion (coming soon)
- 🚧 Tooltip (coming soon)

## Configuration

### Analyzer Options

```typescript
{
  patterns?: string[]           // Filter specific patterns
  minConfidence?: 'low' | 'medium' | 'high'  // Confidence threshold
  includeSuggestions?: boolean  // Include fix suggestions (default: true)
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Type check
pnpm typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Tim Damen](https://github.com/timdamen)

## Related Projects

- [axe-core](https://github.com/dequelabs/axe-core) - Comprehensive accessibility testing engine
- [aria-practices](https://www.w3.org/WAI/ARIA/apg/) - W3C ARIA Authoring Practices Guide

## Acknowledgments

Built with inspiration from axe-core and designed to complement existing accessibility testing tools with a focus on interactive ARIA patterns.
