/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {HostComponent, HostText} from 'shared/ReactWorkTags';
import invariant from 'shared/invariant';

import type {Fiber} from 'react-reconciler/src/ReactFiber';

const domNodeInstanceFibers: WeakMap<Node, Fiber> = new WeakMap();
const domNodeInstanceFiberProps: WeakMap<Node, Object> = new WeakMap();

export function setFiberByDomNodeInstance(
  domNodeInstance: Node,
  fiberHandle: Fiber,
): void {
  domNodeInstanceFibers.set(domNodeInstance, fiberHandle);
}

export function getFiberFromDomNodeInstance(
  domNodeInstance: Node,
): Fiber | void {
  return domNodeInstanceFibers.get(domNodeInstance);
}

export function setFiberPropsByDomNodeInstance(
  domNodeInstance: Node,
  fiberPropsHandle: Object,
): void {
  domNodeInstanceFiberProps.set(domNodeInstance, fiberPropsHandle);
}

export function getFiberPropsFromDomNodeInstance(
  domNodeInstance: Node,
): Fiber | void {
  return domNodeInstanceFiberProps.get(domNodeInstance);
}

/**
 * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
 * instance, or null if the node was not rendered by this React.
 */
export function getFiberFromDomNode(domNode: Node): Fiber | null {
  const inst = getFiberFromDomNodeInstance(domNode);
  if (inst) {
    if (inst.tag === HostComponent || inst.tag === HostText) {
      return inst;
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Given a DOM node, return the closest ReactDOMComponent or
 * ReactDOMTextComponent instance ancestor.
 */
export function getClosestFiberFromDOMNode(
  domNode: void | null | Node,
): Fiber | null {
  if (domNode == null) {
    return null;
  }
  if (domNodeInstanceFibers.has(domNode)) {
    return domNodeInstanceFibers.get(domNode) || null;
  }

  while (!domNodeInstanceFibers.has(domNode)) {
    if (domNode.parentNode) {
      domNode = domNode.parentNode;
    } else {
      // Top of the tree. This node must not be part of a React tree (or is
      // unmounted, potentially).
      return null;
    }
  }

  let inst = domNodeInstanceFibers.get(domNode);
  if (
    inst !== undefined &&
    (inst.tag === HostComponent || inst.tag === HostText)
  ) {
    // In Fiber, this will always be the deepest root.
    return inst;
  }

  return null;
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
export function getDOMNodeFromFiber(fiber: Fiber): Node | null {
  if (fiber.tag === HostComponent || fiber.tag === HostText) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return fiber.stateNode;
  }

  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  invariant(false, 'getDOMNodeFromFiber: Invalid argument.');
}
