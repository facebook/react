/* @flow */

import { parseFor } from 'compiler/parser/index'
import { getAndRemoveAttr, addRawAttr } from 'compiler/helpers'

/**
 * Map the following syntax to corresponding attrs:
 *
 * <recycle-list for="(item, i) in longList" switch="cellType">
 *   <cell-slot case="A"> ... </cell-slot>
 *   <cell-slot case="B"> ... </cell-slot>
 * </recycle-list>
 */

export function preTransformRecycleList (
  el: ASTElement,
  options: WeexCompilerOptions
) {
  const exp = getAndRemoveAttr(el, 'for')
  if (!exp) {
    if (options.warn) {
      options.warn(`Invalid <recycle-list> syntax: missing "for" expression.`)
    }
    return
  }

  const res = parseFor(exp)
  if (!res) {
    if (options.warn) {
      options.warn(`Invalid <recycle-list> syntax: ${exp}.`)
    }
    return
  }

  addRawAttr(el, ':list-data', res.for)
  addRawAttr(el, 'alias', res.alias)
  if (res.iterator2) {
    // (item, key, index) for object iteration
    // is this even supported?
    addRawAttr(el, 'index', res.iterator2)
  } else if (res.iterator1) {
    addRawAttr(el, 'index', res.iterator1)
  }

  const switchKey = getAndRemoveAttr(el, 'switch')
  if (switchKey) {
    addRawAttr(el, 'switch', switchKey)
  }
}
