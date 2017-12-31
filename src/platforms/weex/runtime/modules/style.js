/* @flow */

import { extend, cached, camelize } from 'shared/util'

const normalize = cached(camelize)

function createStyle (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!vnode.data.staticStyle) {
    updateStyle(oldVnode, vnode)
    return
  }
  const elm = vnode.elm
  const staticStyle = vnode.data.staticStyle
  const supportBatchUpdate = typeof elm.setStyles === 'function'
  const batchedStyles = {}
  for (const name in staticStyle) {
    if (staticStyle[name]) {
      supportBatchUpdate
        ? (batchedStyles[normalize(name)] = staticStyle[name])
        : elm.setStyle(normalize(name), staticStyle[name])
    }
  }
  if (supportBatchUpdate) {
    elm.setStyles(batchedStyles)
  }
  updateStyle(oldVnode, vnode)
}

function updateStyle (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.style && !vnode.data.style) {
    return
  }
  let cur, name
  const elm = vnode.elm
  const oldStyle: any = oldVnode.data.style || {}
  let style: any = vnode.data.style || {}

  const needClone = style.__ob__

  // handle array syntax
  if (Array.isArray(style)) {
    style = vnode.data.style = toObject(style)
  }

  // clone the style for future updates,
  // in case the user mutates the style object in-place.
  if (needClone) {
    style = vnode.data.style = extend({}, style)
  }

  const supportBatchUpdate = typeof elm.setStyles === 'function'
  const batchedStyles = {}
  for (name in oldStyle) {
    if (!style[name]) {
      supportBatchUpdate
        ? (batchedStyles[normalize(name)] = '')
        : elm.setStyle(normalize(name), '')
    }
  }
  for (name in style) {
    cur = style[name]
    supportBatchUpdate
      ? (batchedStyles[normalize(name)] = cur)
      : elm.setStyle(normalize(name), cur)
  }
  if (supportBatchUpdate) {
    elm.setStyles(batchedStyles)
  }
}

function toObject (arr) {
  const res = {}
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

export default {
  create: createStyle,
  update: updateStyle
}
