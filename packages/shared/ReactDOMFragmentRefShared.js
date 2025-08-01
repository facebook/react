/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Shared logic for Fragment Ref operations for DOM and Fabric configs
 *
 * @flow
 */

import type {PublicInstance} from 'react-reconciler/src/ReactFiberConfig';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {getNextSiblingHostFiber} from 'react-reconciler/src/ReactFiberTreeReflection';

export function compareDocumentPositionForEmptyFragment(
  fragmentFiber: Fiber,
  parentHostInstance: PublicInstance,
  otherNode: PublicInstance,
  getPublicInstance: (fiber: Fiber) => PublicInstance,
): number {
  let result;
  // If the fragment has no children, we can use the parent and
  // siblings to determine a position.
  // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
  // $FlowFixMe[prop-missing]
  const parentResult = parentHostInstance.compareDocumentPosition(otherNode);
  result = parentResult;
  if (parentHostInstance === otherNode) {
    result = Node.DOCUMENT_POSITION_CONTAINS;
  } else {
    if (parentResult & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      // otherNode is one of the fragment's siblings. Use the next
      // sibling to determine if its preceding or following.
      const nextSiblingFiber = getNextSiblingHostFiber(fragmentFiber);
      if (nextSiblingFiber === null) {
        result = Node.DOCUMENT_POSITION_PRECEDING;
      } else {
        const nextSiblingInstance = getPublicInstance(nextSiblingFiber);
        const nextSiblingResult =
          // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
          // $FlowFixMe[prop-missing]
          nextSiblingInstance.compareDocumentPosition(otherNode);
        if (
          nextSiblingResult === 0 ||
          nextSiblingResult & Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          result = Node.DOCUMENT_POSITION_FOLLOWING;
        } else {
          result = Node.DOCUMENT_POSITION_PRECEDING;
        }
      }
    }
  }

  result |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
  return result;
}

export function compareDocumentPositionForFragment(
  parentInstance: PublicInstance,
  firstInstance: PublicInstance,
  lastInstance: PublicInstance,
  otherNode: PublicInstance,
): number {
  let result;

  // Check if first and last element are actually in the expected document position
  // before relying on them as source of truth for other contained elements
  const firstInstanceIsContained =
    // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
    // $FlowFixMe[prop-missing]
    parentInstance.compareDocumentPosition(firstInstance) &
    Node.DOCUMENT_POSITION_CONTAINED_BY;
  const lastInstanceIsContained =
    // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
    // $FlowFixMe[prop-missing]
    parentInstance.compareDocumentPosition(lastInstance) &
    Node.DOCUMENT_POSITION_CONTAINED_BY;
  // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
  // $FlowFixMe[prop-missing]
  const firstResult = firstInstance.compareDocumentPosition(otherNode);
  // $FlowFixMe[incompatible-use] Fabric PublicInstance is opaque
  // $FlowFixMe[prop-missing]
  const lastResult = lastInstance.compareDocumentPosition(otherNode);

  const otherNodeIsFirstOrLastChild =
    (firstInstanceIsContained && firstInstance === otherNode) ||
    (lastInstanceIsContained && lastInstance === otherNode);
  const otherNodeIsFirstOrLastChildDisconnected =
    (!firstInstanceIsContained && firstInstance === otherNode) ||
    (!lastInstanceIsContained && lastInstance === otherNode);
  const otherNodeIsWithinFirstOrLastChild =
    firstResult & Node.DOCUMENT_POSITION_CONTAINED_BY ||
    lastResult & Node.DOCUMENT_POSITION_CONTAINED_BY;
  const otherNodeIsBetweenFirstAndLastChildren =
    firstInstanceIsContained &&
    lastInstanceIsContained &&
    firstResult & Node.DOCUMENT_POSITION_FOLLOWING &&
    lastResult & Node.DOCUMENT_POSITION_PRECEDING;

  if (
    otherNodeIsFirstOrLastChild ||
    otherNodeIsWithinFirstOrLastChild ||
    otherNodeIsBetweenFirstAndLastChildren
  ) {
    result = Node.DOCUMENT_POSITION_CONTAINED_BY;
  } else if (otherNodeIsFirstOrLastChildDisconnected) {
    // otherNode has been portaled into another container
    result = Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
  } else {
    result = firstResult;
  }

  return result;
}
