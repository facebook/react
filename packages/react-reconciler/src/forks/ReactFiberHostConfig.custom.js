/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a host config that's used for the `react-reconciler` package on npm.
// It is only used by third-party renderers.
//
// Its API lets you pass the host config as an argument.
// However, inside the `react-reconciler` we treat host config as a module.
// This file is a shim between two worlds.
//
// It works because the `react-reconciler` bundle is wrapped in something like:
//
// module.exports = function ($$$config) {
//   /* reconciler code */
// }
//
// So `$$$config` looks like a global variable, but it's
// really an argument to a top-level wrapping function.

declare var $$$hostConfig: any;
export opaque type Type = mixed; // eslint-disable-line no-undef
export opaque type Props = mixed; // eslint-disable-line no-undef
export opaque type Container = mixed; // eslint-disable-line no-undef
export opaque type Instance = mixed; // eslint-disable-line no-undef
export opaque type TextInstance = mixed; // eslint-disable-line no-undef
export opaque type SuspenseInstance = mixed; // eslint-disable-line no-undef
export opaque type HydratableInstance = mixed; // eslint-disable-line no-undef
export opaque type PublicInstance = mixed; // eslint-disable-line no-undef
export opaque type HostContext = mixed; // eslint-disable-line no-undef
export opaque type UpdatePayload = mixed; // eslint-disable-line no-undef
export opaque type ChildSet = mixed; // eslint-disable-line no-undef
export opaque type TimeoutHandle = mixed; // eslint-disable-line no-undef
export opaque type NoTimeout = mixed; // eslint-disable-line no-undef

export const getPublicInstance = $$$hostConfig.getPublicInstance;
export const getRootHostContext = $$$hostConfig.getRootHostContext;
export const getChildHostContext = $$$hostConfig.getChildHostContext;
export const getChildHostContextForEventComponent =
  $$$hostConfig.getChildHostContextForEventComponent;
export const getChildHostContextForEventTarget =
  $$$hostConfig.getChildHostContextForEventTarget;
export const prepareForCommit = $$$hostConfig.prepareForCommit;
export const resetAfterCommit = $$$hostConfig.resetAfterCommit;
export const createInstance = $$$hostConfig.createInstance;
export const appendInitialChild = $$$hostConfig.appendInitialChild;
export const finalizeInitialChildren = $$$hostConfig.finalizeInitialChildren;
export const prepareUpdate = $$$hostConfig.prepareUpdate;
export const shouldSetTextContent = $$$hostConfig.shouldSetTextContent;
export const shouldDeprioritizeSubtree =
  $$$hostConfig.shouldDeprioritizeSubtree;
export const createTextInstance = $$$hostConfig.createTextInstance;
export const scheduleTimeout = $$$hostConfig.setTimeout;
export const cancelTimeout = $$$hostConfig.clearTimeout;
export const noTimeout = $$$hostConfig.noTimeout;
export const now = $$$hostConfig.now;
export const isPrimaryRenderer = $$$hostConfig.isPrimaryRenderer;
export const supportsMutation = $$$hostConfig.supportsMutation;
export const supportsPersistence = $$$hostConfig.supportsPersistence;
export const supportsHydration = $$$hostConfig.supportsHydration;
export const handleEventComponent = $$$hostConfig.handleEventComponent;
export const handleEventTarget = $$$hostConfig.handleEventTarget;
export const getEventTargetChildElement =
  $$$hostConfig.getEventTargetChildElement;

// -------------------
//      Mutation
//     (optional)
// -------------------
export const appendChild = $$$hostConfig.appendChild;
export const appendChildToContainer = $$$hostConfig.appendChildToContainer;
export const commitTextUpdate = $$$hostConfig.commitTextUpdate;
export const commitMount = $$$hostConfig.commitMount;
export const commitUpdate = $$$hostConfig.commitUpdate;
export const insertBefore = $$$hostConfig.insertBefore;
export const insertInContainerBefore = $$$hostConfig.insertInContainerBefore;
export const removeChild = $$$hostConfig.removeChild;
export const removeChildFromContainer = $$$hostConfig.removeChildFromContainer;
export const resetTextContent = $$$hostConfig.resetTextContent;
export const hideInstance = $$$hostConfig.hideInstance;
export const hideTextInstance = $$$hostConfig.hideTextInstance;
export const unhideInstance = $$$hostConfig.unhideInstance;
export const unhideTextInstance = $$$hostConfig.unhideTextInstance;
export const commitTouchHitTargetUpdate =
  $$$hostConfig.commitTouchHitTargetUpdate;
export const commitEventTarget = $$$hostConfig.commitEventTarget;

// -------------------
//     Persistence
//     (optional)
// -------------------
export const cloneInstance = $$$hostConfig.cloneInstance;
export const createContainerChildSet = $$$hostConfig.createContainerChildSet;
export const appendChildToContainerChildSet =
  $$$hostConfig.appendChildToContainerChildSet;
export const finalizeContainerChildren =
  $$$hostConfig.finalizeContainerChildren;
export const replaceContainerChildren = $$$hostConfig.replaceContainerChildren;
export const cloneHiddenInstance = $$$hostConfig.cloneHiddenInstance;
export const cloneHiddenTextInstance = $$$hostConfig.cloneHiddenTextInstance;

// -------------------
//     Hydration
//     (optional)
// -------------------
export const canHydrateInstance = $$$hostConfig.canHydrateInstance;
export const canHydrateTextInstance = $$$hostConfig.canHydrateTextInstance;
export const canHydrateSuspenseInstance =
  $$$hostConfig.canHydrateSuspenseInstance;
export const isSuspenseInstancePending =
  $$$hostConfig.isSuspenseInstancePending;
export const isSuspenseInstanceFallback =
  $$$hostConfig.isSuspenseInstanceFallback;
export const registerSuspenseInstanceRetry =
  $$$hostConfig.registerSuspenseInstanceRetry;
export const getNextHydratableSibling = $$$hostConfig.getNextHydratableSibling;
export const getFirstHydratableChild = $$$hostConfig.getFirstHydratableChild;
export const hydrateInstance = $$$hostConfig.hydrateInstance;
export const hydrateTextInstance = $$$hostConfig.hydrateTextInstance;
export const getNextHydratableInstanceAfterSuspenseInstance =
  $$$hostConfig.getNextHydratableInstanceAfterSuspenseInstance;
export const clearSuspenseBoundary = $$$hostConfig.clearSuspenseBoundary;
export const clearSuspenseBoundaryFromContainer =
  $$$hostConfig.clearSuspenseBoundaryFromContainer;
export const didNotMatchHydratedContainerTextInstance =
  $$$hostConfig.didNotMatchHydratedContainerTextInstance;
export const didNotMatchHydratedTextInstance =
  $$$hostConfig.didNotMatchHydratedTextInstance;
export const didNotHydrateContainerInstance =
  $$$hostConfig.didNotHydrateContainerInstance;
export const didNotHydrateInstance = $$$hostConfig.didNotHydrateInstance;
export const didNotFindHydratableContainerInstance =
  $$$hostConfig.didNotFindHydratableContainerInstance;
export const didNotFindHydratableContainerTextInstance =
  $$$hostConfig.didNotFindHydratableContainerTextInstance;
export const didNotFindHydratableContainerSuspenseInstance =
  $$$hostConfig.didNotFindHydratableContainerSuspenseInstance;
export const didNotFindHydratableInstance =
  $$$hostConfig.didNotFindHydratableInstance;
export const didNotFindHydratableTextInstance =
  $$$hostConfig.didNotFindHydratableTextInstance;
export const didNotFindHydratableSuspenseInstance =
  $$$hostConfig.didNotFindHydratableSuspenseInstance;
