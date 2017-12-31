/* @flow */

import { addHandler, addAttr } from 'compiler/helpers'
import { genComponentModel, genAssignmentCode } from 'compiler/directives/model'

export default function model (
  el: ASTElement,
  dir: ASTDirective,
  _warn: Function
): ?boolean {
  if (el.tag === 'input' || el.tag === 'textarea') {
    genDefaultModel(el, dir.value, dir.modifiers)
  } else {
    genComponentModel(el, dir.value, dir.modifiers)
  }
}

function genDefaultModel (
  el: ASTElement,
  value: string,
  modifiers: ?ASTModifiers
): ?boolean {
  const { lazy, trim, number } = modifiers || {}
  const event = lazy ? 'change' : 'input'

  let valueExpression = `$event.target.attr.value${trim ? '.trim()' : ''}`
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }

  const code = genAssignmentCode(value, valueExpression)
  addAttr(el, 'value', `(${value})`)
  addHandler(el, event, code, null, true)
}
