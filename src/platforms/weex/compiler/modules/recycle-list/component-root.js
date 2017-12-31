/* @flow */

import { addAttr } from 'compiler/helpers'

// mark component root nodes as
export function postTransformComponentRoot (
  el: ASTElement,
  options: WeexCompilerOptions
) {
  if (!el.parent) {
    // component root
    addAttr(el, '@isComponentRoot', 'true')
    addAttr(el, '@componentProps', '$props || {}')
  }
}
