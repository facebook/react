/* @flow */

import { preTransformRecycleList } from './recycle-list'
import { postTransformComponent } from './component'
import { postTransformComponentRoot } from './component-root'
import { postTransformText } from './text'
import { preTransformVBind } from './v-bind'
import { preTransformVIf } from './v-if'
import { preTransformVFor } from './v-for'
import { postTransformVOn } from './v-on'

let currentRecycleList = null

function shouldCompile (el: ASTElement, options: WeexCompilerOptions) {
  return options.recyclable ||
    (currentRecycleList && el !== currentRecycleList)
}

function preTransformNode (el: ASTElement, options: WeexCompilerOptions) {
  if (el.tag === 'recycle-list') {
    preTransformRecycleList(el, options)
    currentRecycleList = el
  }
  if (shouldCompile(el, options)) {
    preTransformVBind(el, options)
    preTransformVIf(el, options) // also v-else-if and v-else
    preTransformVFor(el, options)
  }
}

function transformNode (el: ASTElement, options: WeexCompilerOptions) {
  if (shouldCompile(el, options)) {
    // do nothing yet
  }
}

function postTransformNode (el: ASTElement, options: WeexCompilerOptions) {
  if (shouldCompile(el, options)) {
    // mark child component in parent template
    postTransformComponent(el, options)
    // mark root in child component template
    postTransformComponentRoot(el, options)
    // <text>: transform children text into value attr
    if (el.tag === 'text') {
      postTransformText(el, options)
    }
    postTransformVOn(el, options)
  }
  if (el === currentRecycleList) {
    currentRecycleList = null
  }
}

export default {
  preTransformNode,
  transformNode,
  postTransformNode
}
