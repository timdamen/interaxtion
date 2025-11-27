import ariaAttrs from './aria-attrs'
import ariaRoles from './aria-roles'
import dpubRoles from './dpub-roles'
import graphicsRoles from './graphics-roles'
import htmlElms from './html-elms'
import cssColors from './css-colors'

// Simple deep merge utility
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

const originals = {
  ariaAttrs,
  ariaRoles: {
    ...ariaRoles,
    ...dpubRoles,
    ...graphicsRoles
  },
  htmlElms,
  cssColors
}

const standards = {
  ...originals
}

export type Standards = typeof standards
export type StandardsConfig = Partial<{
  [K in keyof Standards]: any
}>

export function configureStandards(config: StandardsConfig): void {
  Object.keys(standards).forEach(propName => {
    const key = propName as keyof Standards
    if (config[key]) {
      (standards as any)[key] = deepMerge((standards as any)[key], config[key])
    }
  })
}

export function resetStandards(): void {
  Object.keys(standards).forEach(propName => {
    const key = propName as keyof typeof originals
    ;(standards as any)[key] = (originals as any)[key]
  })
}

export default standards
