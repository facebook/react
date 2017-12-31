/* @flow */

import {
  RAW,
  // INTERPOLATION,
  EXPRESSION
} from './codegen'

import {
  propsToAttrMap,
  isRenderableAttr
} from 'web/server/util'

import {
  isBooleanAttr,
  isEnumeratedAttr
} from 'web/util/attrs'

import type { StringSegment } from './codegen'
import type { CodegenState } from 'compiler/codegen/index'

type Attr = { name: string; value: string };

const plainStringRE = /^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$/

// let the model AST transform translate v-model into appropriate
// props bindings
export function applyModelTransform (el: ASTElement, state: CodegenState) {
  if (el.directives) {
    for (let i = 0; i < el.directives.length; i++) {
      const dir = el.directives[i]
      if (dir.name === 'model') {
        state.directives.model(el, dir, state.warn)
        // remove value for textarea as its converted to text
        if (el.tag === 'textarea' && el.props) {
          el.props = el.props.filter(p => p.name !== 'value')
        }
        break
      }
    }
  }
}

export function genAttrSegments (
  attrs: Array<Attr>
): Array<StringSegment> {
  return attrs.map(({ name, value }) => genAttrSegment(name, value))
}

export function genDOMPropSegments (
  props: Array<Attr>,
  attrs: ?Array<Attr>
): Array<StringSegment> {
  const segments = []
  props.forEach(({ name, value }) => {
    name = propsToAttrMap[name] || name.toLowerCase()
    if (isRenderableAttr(name) &&
      !(attrs && attrs.some(a => a.name === name))
    ) {
      segments.push(genAttrSegment(name, value))
    }
  })
  return segments
}

function genAttrSegment (name: string, value: string): StringSegment {
  if (plainStringRE.test(value)) {
    // force double quote
    value = value.replace(/^'|'$/g, '"')
    // force enumerated attr to "true"
    if (isEnumeratedAttr(name) && value !== `"false"`) {
      value = `"true"`
    }
    return {
      type: RAW,
      value: isBooleanAttr(name)
        ? ` ${name}="${name}"`
        : value === '""'
          ? ` ${name}`
          : ` ${name}="${JSON.parse(value)}"`
    }
  } else {
    return {
      type: EXPRESSION,
      value: `_ssrAttr(${JSON.stringify(name)},${value})`
    }
  }
}

export function genClassSegments (
  staticClass: ?string,
  classBinding: ?string
): Array<StringSegment> {
  if (staticClass && !classBinding) {
    return [{ type: RAW, value: ` class=${staticClass}` }]
  } else {
    return [{
      type: EXPRESSION,
      value: `_ssrClass(${staticClass || 'null'},${classBinding || 'null'})`
    }]
  }
}

export function genStyleSegments (
  staticStyle: ?string,
  parsedStaticStyle: ?string,
  styleBinding: ?string,
  vShowExpression: ?string
): Array<StringSegment> {
  if (staticStyle && !styleBinding && !vShowExpression) {
    return [{ type: RAW, value: ` style=${JSON.stringify(staticStyle)}` }]
  } else {
    return [{
      type: EXPRESSION,
      value: `_ssrStyle(${
        parsedStaticStyle || 'null'
      },${
        styleBinding || 'null'
      }, ${
        vShowExpression
          ? `{ display: (${vShowExpression}) ? '' : 'none' }`
          : 'null'
      })`
    }]
  }
}
