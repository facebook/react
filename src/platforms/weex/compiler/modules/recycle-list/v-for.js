/* @flow */

import { parseFor } from 'compiler/parser/index'
import { getAndRemoveAttr, addRawAttr } from 'compiler/helpers'

export function preTransformVFor (el: ASTElement, options: WeexCompilerOptions) {
  const exp = getAndRemoveAttr(el, 'v-for')
  if (!exp) {
    return
  }

  const res = parseFor(exp)
  if (!res) {
    if (process.env.NODE_ENV !== 'production' && options.warn) {
      options.warn(`Invalid v-for expression: ${exp}`)
    }
    return
  }

  const desc: Object = {
    '@expression': res.for,
    '@alias': res.alias
  }
  if (res.iterator2) {
    desc['@key'] = res.iterator1
    desc['@index'] = res.iterator2
  } else {
    desc['@index'] = res.iterator1
  }

  delete el.attrsMap['v-for']
  addRawAttr(el, '[[repeat]]', desc)
}
