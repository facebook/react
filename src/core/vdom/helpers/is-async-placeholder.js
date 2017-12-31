/* @flow */

export function isAsyncPlaceholder (node: VNode): boolean {
  return node.isComment && node.asyncFactory
}
