/* @flow */

import { makeMap } from 'shared/util'

// The "unitary tag" means that the tag node and its children
// must be sent to the native together.
const isUnitaryTag = makeMap('cell,header,cell-slot,recycle-list', true)

function preTransformNode (el: ASTElement, options: CompilerOptions) {
  if (isUnitaryTag(el.tag) && !el.attrsList.some(item => item.name === 'append')) {
    el.attrsMap.append = 'tree'
    el.attrsList.push({ name: 'append', value: 'tree' })
  }
  if (el.attrsMap.append === 'tree') {
    el.appendAsTree = true
  }
}

function genData (el: ASTElement): string {
  return el.appendAsTree ? `appendAsTree:true,` : ''
}

export default {
  staticKeys: ['appendAsTree'],
  preTransformNode,
  genData
}
