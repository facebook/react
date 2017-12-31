/* @flow */

import { looseEqual, looseIndexOf } from 'shared/util'

// this is only applied for <select v-model> because it is the only edge case
// that must be done at runtime instead of compile time.
export default function model (node: VNodeWithData, dir: VNodeDirective) {
  if (!node.children) return
  const value = dir.value
  const isMultiple = node.data.attrs && node.data.attrs.multiple
  for (let i = 0, l = node.children.length; i < l; i++) {
    const option = node.children[i]
    if (option.tag === 'option') {
      if (isMultiple) {
        const selected =
          Array.isArray(value) &&
          (looseIndexOf(value, getValue(option)) > -1)
        if (selected) {
          setSelected(option)
        }
      } else {
        if (looseEqual(value, getValue(option))) {
          setSelected(option)
          return
        }
      }
    }
  }
}

function getValue (option) {
  const data = option.data || {}
  return (
    (data.attrs && data.attrs.value) ||
    (data.domProps && data.domProps.value) ||
    (option.children && option.children[0] && option.children[0].text)
  )
}

function setSelected (option) {
  const data = option.data || (option.data = {})
  const attrs = data.attrs || (data.attrs = {})
  attrs.selected = ''
}
