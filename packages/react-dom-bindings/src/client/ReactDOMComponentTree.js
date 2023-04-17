/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {
  ReactDOMEventHandle,
  ReactDOMEventHandleListener,
} from './ReactDOMEventHandleTypes';
import type {
  Container,
  TextInstance,
  Instance,
  SuspenseInstance,
  Props,
  HoistableRoot,
  RootResources,
} from './ReactDOMHostConfig';

import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
  HostRoot,
  SuspenseComponent,
} from 'react-reconciler/src/ReactWorkTags';

import {getParentSuspenseInstance} from './ReactDOMHostConfig';

import {
  enableScopeAPI,
  enableFloat,
  enableHostSingletons,
} from 'shared/ReactFeatureFlags';

const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
const internalRootNodeResourcesKey = '__reactResources$' + randomKey;
const internalHoistableMarker = '__reactMarker$' + randomKey;

export function detachDeletedInstance(node: Instance): void {
  // TODO: This function is only called on host components. I don't think all of
  // these fields are relevant.
  delete (node: any)[internalInstanceKey];
  delete (node: any)[internalPropsKey];
  delete (node: any)[internalEventHandlersKey];
  delete (node: any)[internalEventHandlerListenersKey];
  delete (node: any)[internalEventHandlesSetKey];
}

export function precacheFiberNode(
  hostInst: Fiber,
  node: Instance | TextInstance | SuspenseInstance | ReactScopeInstance,
): void {
  (node: any)[internalInstanceKey] = hostInst;
}

export function markContainerAsRoot(hostRoot: Fiber, node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = hostRoot;
}

export function unmarkContainerAsRoot(node: Container): void {
  // $FlowFixMe[prop-missing]
  node[internalContainerInstanceKey] = null;
}

export function isContainerMarkedAsRoot(node: Container): boolean {
  // $FlowFixMe[prop-missing]
  return !!node[internalContainerInstanceKey];
}

// Given a DOM node, return the closest HostComponent or HostText fiber ancestor.
// If the target node is part of a hydrated or not yet rendered subtree, then
// this may also return a SuspenseComponent or HostRoot to indicate that.
// Conceptually the HostRoot fiber is a child of the Container node. So if you
// pass the Container node as the targetNode, you will not actually get the
// HostRoot back. To get to the HostRoot, you need to pass a child of it.
// The same thing applies to Suspense boundaries.
export function getClosestInstanceFromNode(targetNode: Node): null | Fiber {
  let targetInst = (targetNode: any)[internalInstanceKey];
  if (targetInst) {
    // Don't return HostRoot or SuspenseComponent here.
    return targetInst;
  }
  // If the direct event target isn't a React owned DOM node, we need to look
  // to see if one of its parents is a React owned DOM node.
  let parentNode = targetNode.parentNode;
  while (parentNode) {
    // We'll check if this is a container root that could include
    // React nodes in the future. We need to check this first because
    // if we're a child of a dehydrated container, we need to first
    // find that inner container before moving on to finding the parent
    // instance. Note that we don't check this field on  the targetNode
    // itself because the fibers are conceptually between the container
    // node and the first child. It isn't surrounding the container node.
    // If it's not a container, we check if it's an instance.
    targetInst =
      (parentNode: any)[internalContainerInstanceKey] ||
      (parentNode: any)[internalInstanceKey];
    if (targetInst) {
      // Since this wasn't the direct target of the event, we might have
      // stepped past dehydrated DOM nodes to get here. However they could
      // also have been non-React nodes. We need to answer which one.

      // If we the instance doesn't have any children, then there can't be
      // a nested suspense boundary within it. So we can use this as a fast
      // bailout. Most of the time, when people add non-React children to
      // the tree, it is using a ref to a child-less DOM node.
      // Normally we'd only need to check one of the fibers because if it
      // has ever gone from having children to deleting them or vice versa
      // it would have deleted the dehydrated boundary nested inside already.
      // However, since the HostRoot starts out with an alternate it might
      // have one on the alternate so we need to check in case this was a
      // root.
      const alternate = targetInst.alternate;
      if (
        targetInst.child !== null ||
        (alternate !== null && alternate.child !== null)
      ) {
        // Next we need to figure out if the node that skipped past is
        // nested within a dehydrated boundary and if so, which one.
        let suspenseInstance = getParentSuspenseInstance(targetNode);
        while (suspenseInstance !== null) {
          // We found a suspense instance. That means that we haven't
          // hydrated it yet. Even though we leave the comments in the
          // DOM after hydrating, and there are boundaries in the DOM
          // that could already be hydrated, we wouldn't have found them
          // through this pass since if the target is hydrated it would
          // have had an internalInstanceKey on it.
          // Let's get the fiber associated with the SuspenseComponent
          // as the deepest instance.
          // $FlowFixMe[prop-missing]
          const targetSuspenseInst = suspenseInstance[internalInstanceKey];
          if (targetSuspenseInst) {
            return targetSuspenseInst;
          }
          // If we don't find a Fiber on the comment, it might be because
          // we haven't gotten to hydrate it yet. There might still be a
          // parent boundary that hasn't above this one so we need to find
          // the outer most that is known.
          suspenseInstance = getParentSuspenseInstance(suspenseInstance);
          // If we don't find one, then that should mean that the parent
          // host component also hasn't hydrated yet. We can return it
          // below since it will bail out on the isMounted check later.
        }
      }
      return targetInst;
    }
    targetNode = parentNode;
    parentNode = targetNode.parentNode;
  }
  return null;
}

/**
 * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
 * instance, or null if the node was not rendered by this React.
 */
export function getInstanceFromNode(node: Node): Fiber | null {
  const inst =
    (node: any)[internalInstanceKey] ||
    (node: any)[internalContainerInstanceKey];
  if (inst) {
    const tag = inst.tag;
    if (
      tag === HostComponent ||
      tag === HostText ||
      tag === SuspenseComponent ||
      (enableFloat ? tag === HostHoistable : false) ||
      (enableHostSingletons ? tag === HostSingleton : false) ||
      tag === HostRoot
    ) {
      return inst;
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
export function getNodeFromInstance(inst: Fiber): Instance | TextInstance {
  const tag = inst.tag;
  if (
    tag === HostComponent ||
    (enableFloat ? tag === HostHoistable : false) ||
    (enableHostSingletons ? tag === HostSingleton : false) ||
    tag === HostText
  ) {
    // In Fiber this, is just the state node right now. We assume it will be
    // a host component or host text.
    return inst.stateNode;
  }

  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  throw new Error('getNodeFromInstance: Invalid argument.');
}

export function getFiberCurrentPropsFromNode(
  node: Instance | TextInstance | SuspenseInstance,
): Props {
  return (node: any)[internalPropsKey] || null;
}

export function updateFiberProps(
  node: Instance | TextInstance | SuspenseInstance,
  props: Props,
): void {
  (node: any)[internalPropsKey] = props;
}

export function getEventListenerSet(node: EventTarget): Set<string> {
  let elementListenerSet = (node: any)[internalEventHandlersKey];
  if (elementListenerSet === undefined) {
    elementListenerSet = (node: any)[internalEventHandlersKey] = new Set();
  }
  return elementListenerSet;
}

export function getFiberFromScopeInstance(
  scope: ReactScopeInstance,
): null | Fiber {
  if (enableScopeAPI) {
    return (scope: any)[internalInstanceKey] || null;
  }
  return null;
}

export function setEventHandlerListeners(
  scope: EventTarget | ReactScopeInstance,
  listeners: Set<ReactDOMEventHandleListener>,
): void {
  (scope: any)[internalEventHandlerListenersKey] = listeners;
}

export function getEventHandlerListeners(
  scope: EventTarget | ReactScopeInstance,
): null | Set<ReactDOMEventHandleListener> {
  return (scope: any)[internalEventHandlerListenersKey] || null;
}

export function addEventHandleToTarget(
  target: EventTarget | ReactScopeInstance,
  eventHandle: ReactDOMEventHandle,
): void {
  let eventHandles = (target: any)[internalEventHandlesSetKey];
  if (eventHandles === undefined) {
    eventHandles = (target: any)[internalEventHandlesSetKey] = new Set();
  }
  eventHandles.add(eventHandle);
}

export function doesTargetHaveEventHandle(
  target: EventTarget | ReactScopeInstance,
  eventHandle: ReactDOMEventHandle,
): boolean {
  const eventHandles = (target: any)[internalEventHandlesSetKey];
  if (eventHandles === undefined) {
    return false;
  }
  return eventHandles.has(eventHandle);
}

export function getResourcesFromRoot(root: HoistableRoot): RootResources {
  let resources = (root: any)[internalRootNodeResourcesKey];
  if (!resources) {
    resources = (root: any)[internalRootNodeResourcesKey] = {
      hoistableStyles: new Map(),
      hoistableScripts: new Map(),
    };
  }
  return resources;
}

export function isMarkedHoistable(node: Node): boolean {
  return !!(node: any)[internalHoistableMarker];
}

export function markNodeAsHoistable(node: Node) {
  (node: any)[internalHoistableMarker] = true;
}

export function isOwnedInstance(node: Node): boolean {
  return !!(
    (node: any)[internalHoistableMarker] || (node: any)[internalInstanceKey]
  );
}
