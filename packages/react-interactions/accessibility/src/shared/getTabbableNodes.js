/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeMethods} from 'shared/ReactTypes';

export default function getTabbableNodes(scope: ReactScopeMethods) {
  const tabbableNodes = scope.getScopedNodes();
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
