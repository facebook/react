/* @flow */

import VNode from 'core/vdom/vnode'
import { renderAttr } from './attrs'
import { isDef, isUndef, extend } from 'shared/util'
import { propsToAttrMap, isRenderableAttr } from '../util'

export default function renderDOMProps (node: VNodeWithData): string {
  let props = node.data.domProps
  let res = ''

  let parent = node.parent
  while (isDef(parent)) {
    if (parent.data && parent.data.domProps) {
      props = extend(extend({}, props), parent.data.domProps)
    }
    parent = parent.parent
  }

  if (isUndef(props)) {
    return res
  }

  const attrs = node.data.attrs
  for (const key in props) {
    if (key === 'innerHTML') {
      setText(node, props[key], true)
    } else if (key === 'textContent') {
      setText(node, props[key], false)
    } else if (key === 'value' && node.tag === 'textarea') {
      setText(node, props[key], false)
    } else {
      // $flow-disable-line (WTF?)
      const attr = propsToAttrMap[key] || key.toLowerCase()
      if (isRenderableAttr(attr) &&
        // avoid rendering double-bound props/attrs twice
        !(isDef(attrs) && isDef(attrs[attr]))
      ) {
        res += renderAttr(attr, props[key])
      }
    }
  }
  return res
}

function setText (node, text, raw) {
  const child = new VNode(undefined, undefined, undefined, text)
  child.raw = raw
  node.children = [child]
}
