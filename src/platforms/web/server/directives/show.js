/* @flow */

export default function show (node: VNodeWithData, dir: VNodeDirective) {
  if (!dir.value) {
    const style: any = node.data.style || (node.data.style = {})
    style.display = 'none'
  }
}
