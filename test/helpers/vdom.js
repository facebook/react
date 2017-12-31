import VNode from 'core/vdom/vnode'

window.createTextVNode = function (text) {
  return new VNode(undefined, undefined, undefined, text)
}
