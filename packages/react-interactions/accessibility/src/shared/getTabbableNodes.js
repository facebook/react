/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeMethods} from 'shared/ReactTypes';

export default function getTabbableNodes(
  scopeQuery: (type: string | Object, props: Object) => boolean,
  scope: ReactScopeMethods,
): [
  null | Array<HTMLElement>,
  null | HTMLElement,
  null | HTMLElement,
  number,
  null | HTMLElement,
] {
  const tabbableNodes = scope.queryAllNodes(scopeQuery);
  if (tabbableNodes === null || tabbableNodes.length === 0) {
    return [null, null, null, 0, null];
  }
  const firstTabbableElem = tabbableNodes[0];
  const lastTabbableElem = tabbableNodes[tabbableNodes.length - 1];
  const currentIndex = tabbableNodes.indexOf(document.activeElement);
  let focusedElement = null;
  if (currentIndex !== -1) {
    focusedElement = tabbableNodes[currentIndex];
  }
  return [
    tabbableNodes,
    firstTabbableElem,
    lastTabbableElem,
    currentIndex,
    focusedElement,
  ];
}
