/* @flow */

import { extend } from 'shared/util'

function updateAttrs (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.attrs && !vnode.data.attrs) {
    return
  }
  let key, cur, old
  const elm = vnode.elm
  const oldAttrs = oldVnode.data.attrs || {}
  let attrs = vnode.data.attrs || {}
  // clone observed objects, as the user probably wants to mutate it
  if (attrs.__ob__) {
    attrs = vnode.data.attrs = extend({}, attrs)
  }

  const supportBatchUpdate = typeof elm.setAttrs === 'function'
  const batchedAttrs = {}
  for (key in attrs) {
    cur = attrs[key]
    old = oldAttrs[key]
    if (old !== cur) {
      supportBatchUpdate
        ? (batchedAttrs[key] = cur)
        : elm.setAttr(key, cur)
    }
  }
  for (key in oldAttrs) {
    if (attrs[key] == null) {
      supportBatchUpdate
        ? (batchedAttrs[key] = undefined)
        : elm.setAttr(key)
    }
  }
  if (supportBatchUpdate) {
    elm.setAttrs(batchedAttrs)
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs
}
