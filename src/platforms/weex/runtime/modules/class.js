/* @flow */

import { extend } from 'shared/util'

function updateClass (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  const el = vnode.elm
  const ctx = vnode.context

  const data: VNodeData = vnode.data
  const oldData: VNodeData = oldVnode.data
  if (!data.staticClass &&
    !data.class &&
    (!oldData || (!oldData.staticClass && !oldData.class))
  ) {
    return
  }

  const oldClassList = []
  // unlike web, weex vnode staticClass is an Array
  const oldStaticClass: any = oldData.staticClass
  if (oldStaticClass) {
    oldClassList.push.apply(oldClassList, oldStaticClass)
  }
  if (oldData.class) {
    oldClassList.push.apply(oldClassList, oldData.class)
  }

  const classList = []
  // unlike web, weex vnode staticClass is an Array
  const staticClass: any = data.staticClass
  if (staticClass) {
    classList.push.apply(classList, staticClass)
  }
  if (data.class) {
    classList.push.apply(classList, data.class)
  }

  const style = getStyle(oldClassList, classList, ctx)
  if (typeof el.setStyles === 'function') {
    el.setStyles(style)
  } else {
    for (const key in style) {
      el.setStyle(key, style[key])
    }
  }
}

function getStyle (oldClassList: Array<string>, classList: Array<string>, ctx: Component): Object {
  // style is a weex-only injected object
  // compiled from <style> tags in weex files
  const stylesheet: any = ctx.$options.style || {}
  const result = {}
  classList.forEach(name => {
    const style = stylesheet[name]
    extend(result, style)
  })
  oldClassList.forEach(name => {
    const style = stylesheet[name]
    for (const key in style) {
      if (!result.hasOwnProperty(key)) {
        result[key] = ''
      }
    }
  })
  return result
}

export default {
  create: updateClass,
  update: updateClass
}
