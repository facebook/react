/* @flow */

// The SSR codegen is essentially extending the default codegen to handle
// SSR-optimizable nodes and turn them into string render fns. In cases where
// a node is not optimizable it simply falls back to the default codegen.

import {
  genIf,
  genFor,
  genData,
  genText,
  genElement,
  genChildren,
  CodegenState
} from 'compiler/codegen/index'

import {
  genAttrSegments,
  genDOMPropSegments,
  genClassSegments,
  genStyleSegments,
  applyModelTransform
} from './modules'

import { escape } from 'web/server/util'
import { optimizability } from './optimizer'
import type { CodegenResult } from 'compiler/codegen/index'

export type StringSegment = {
  type: number;
  value: string;
};

// segment types
export const RAW = 0
export const INTERPOLATION = 1
export const EXPRESSION = 2

export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {
  const state = new CodegenState(options)
  const code = ast ? genSSRElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

function genSSRElement (el: ASTElement, state: CodegenState): string {
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genSSRElement)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state, genSSRElement)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return el.ssrOptimizability === optimizability.FULL
      ? genChildrenAsStringNode(el, state)
      : genSSRChildren(el, state) || 'void 0'
  }

  switch (el.ssrOptimizability) {
    case optimizability.FULL:
      // stringify whole tree
      return genStringElement(el, state)
    case optimizability.SELF:
      // stringify self and check children
      return genStringElementWithChildren(el, state)
    case optimizability.CHILDREN:
      // generate self as VNode and stringify children
      return genNormalElement(el, state, true)
    case optimizability.PARTIAL:
      // generate self as VNode and check children
      return genNormalElement(el, state, false)
    default:
      // bail whole tree
      return genElement(el, state)
  }
}

function genNormalElement (el, state, stringifyChildren) {
  const data = el.plain ? undefined : genData(el, state)
  const children = stringifyChildren
    ? `[${genChildrenAsStringNode(el, state)}]`
    : genSSRChildren(el, state, true)
  return `_c('${el.tag}'${
    data ? `,${data}` : ''
  }${
    children ? `,${children}` : ''
  })`
}

function genSSRChildren (el, state, checkSkip) {
  return genChildren(el, state, checkSkip, genSSRElement, genSSRNode)
}

function genSSRNode (el, state) {
  return el.type === 1
    ? genSSRElement(el, state)
    : genText(el)
}

function genChildrenAsStringNode (el, state) {
  return el.children.length
    ? `_ssrNode(${flattenSegments(childrenToSegments(el, state))})`
    : ''
}

function genStringElement (el, state) {
  return `_ssrNode(${elementToString(el, state)})`
}

function genStringElementWithChildren (el, state) {
  const children = genSSRChildren(el, state, true)
  return `_ssrNode(${
    flattenSegments(elementToOpenTagSegments(el, state))
  },"</${el.tag}>"${
    children ? `,${children}` : ''
  })`
}

function elementToString (el, state) {
  return `(${flattenSegments(elementToSegments(el, state))})`
}

function elementToSegments (el, state): Array<StringSegment> {
  // v-for / v-if
  if (el.for && !el.forProcessed) {
    el.forProcessed = true
    return [{
      type: EXPRESSION,
      value: genFor(el, state, elementToString, '_ssrList')
    }]
  } else if (el.if && !el.ifProcessed) {
    el.ifProcessed = true
    return [{
      type: EXPRESSION,
      value: genIf(el, state, elementToString, '"<!---->"')
    }]
  } else if (el.tag === 'template') {
    return childrenToSegments(el, state)
  }

  const openSegments = elementToOpenTagSegments(el, state)
  const childrenSegments = childrenToSegments(el, state)
  const { isUnaryTag } = state.options
  const close = (isUnaryTag && isUnaryTag(el.tag))
    ? []
    : [{ type: RAW, value: `</${el.tag}>` }]
  return openSegments.concat(childrenSegments, close)
}

function elementToOpenTagSegments (el, state): Array<StringSegment> {
  applyModelTransform(el, state)
  let binding
  const segments = [{ type: RAW, value: `<${el.tag}` }]
  // attrs
  if (el.attrs) {
    segments.push.apply(segments, genAttrSegments(el.attrs))
  }
  // domProps
  if (el.props) {
    segments.push.apply(segments, genDOMPropSegments(el.props, el.attrs))
  }
  // v-bind="object"
  if ((binding = el.attrsMap['v-bind'])) {
    segments.push({ type: EXPRESSION, value: `_ssrAttrs(${binding})` })
  }
  // v-bind.prop="object"
  if ((binding = el.attrsMap['v-bind.prop'])) {
    segments.push({ type: EXPRESSION, value: `_ssrDOMProps(${binding})` })
  }
  // class
  if (el.staticClass || el.classBinding) {
    segments.push.apply(
      segments,
      genClassSegments(el.staticClass, el.classBinding)
    )
  }
  // style & v-show
  if (el.staticStyle || el.styleBinding || el.attrsMap['v-show']) {
    segments.push.apply(
      segments,
      genStyleSegments(
        el.attrsMap.style,
        el.staticStyle,
        el.styleBinding,
        el.attrsMap['v-show']
      )
    )
  }
  // _scopedId
  if (state.options.scopeId) {
    segments.push({ type: RAW, value: ` ${state.options.scopeId}` })
  }
  segments.push({ type: RAW, value: `>` })
  return segments
}

function childrenToSegments (el, state): Array<StringSegment> {
  let binding
  if ((binding = el.attrsMap['v-html'])) {
    return [{ type: EXPRESSION, value: `_s(${binding})` }]
  }
  if ((binding = el.attrsMap['v-text'])) {
    return [{ type: INTERPOLATION, value: `_s(${binding})` }]
  }
  if (el.tag === 'textarea' && (binding = el.attrsMap['v-model'])) {
    return [{ type: INTERPOLATION, value: `_s(${binding})` }]
  }
  return el.children
    ? nodesToSegments(el.children, state)
    : []
}

function nodesToSegments (
  children: Array<ASTNode>,
  state: CodegenState
): Array<StringSegment> {
  const segments = []
  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    if (c.type === 1) {
      segments.push.apply(segments, elementToSegments(c, state))
    } else if (c.type === 2) {
      segments.push({ type: INTERPOLATION, value: c.expression })
    } else if (c.type === 3) {
      segments.push({ type: RAW, value: escape(c.text) })
    }
  }
  return segments
}

function flattenSegments (segments: Array<StringSegment>): string {
  const mergedSegments = []
  let textBuffer = ''

  const pushBuffer = () => {
    if (textBuffer) {
      mergedSegments.push(JSON.stringify(textBuffer))
      textBuffer = ''
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]
    if (s.type === RAW) {
      textBuffer += s.value
    } else if (s.type === INTERPOLATION) {
      pushBuffer()
      mergedSegments.push(`_ssrEscape(${s.value})`)
    } else if (s.type === EXPRESSION) {
      pushBuffer()
      mergedSegments.push(`(${s.value})`)
    }
  }
  pushBuffer()

  return mergedSegments.join('+')
}
