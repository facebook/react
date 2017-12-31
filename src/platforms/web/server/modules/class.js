/* @flow */

import { escape } from '../util'
import { genClassForVnode } from 'web/util/index'

export default function renderClass (node: VNodeWithData): ?string {
  const classList = genClassForVnode(node)
  if (classList !== '') {
    return ` class="${escape(classList)}"`
  }
}
