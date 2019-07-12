/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_RESPONDER_TYPE} from 'shared/ReactSymbols';

const isArray = Array.isArray;

function isEventResponderElement(element: Object) {
  return (
    element != null &&
    element.type != null &&
    element.type.$$typeof === REACT_RESPONDER_TYPE
  );
}

export default function removeEventRespondersFromChildren(
  children: any,
): null | mixed {
  if (children != null) {
    if (isArray(children)) {
      let hasResponder = false;
      const newChildren = [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isEventResponderElement(child)) {
          hasResponder = true;
        } else {
          newChildren.push(child);
        }
      }
      const len = newChildren.length;
      if (len === 0) {
        return null;
      }
      if (hasResponder && len === 1) {
        return newChildren[0];
      }
      return newChildren;
    } else if (isEventResponderElement(children)) {
      return null;
    }
  }
  return children;
}
