/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
export opaque type RendererInspectionConfig = mixed; // eslint-disable-line no-undef
export type EventResponder = any;

export const getPublicInstance = $$$hostConfig.getPublicInstance;
export const getRootHostContext = $$$hostConfig.getRootHostContext;
export const getChildHostContext = $$$hostConfig.getChildHostContext;
export const prepareForCommit = $$$hostConfig.prepareForCommit;
export const resetAfterCommit = $$$hostConfig.resetAfterCommit;
export const createInstance = $$$hostConfig.createInstance;
export const appendInitialChild = $$$hostConfig.appendInitialChild;
export const finalizeInitialChildren = $$$hostConfig.finalizeInitialChildren;
export const prepareUpdate = $$$hostConfig.prepareUpdate;
export const shouldSetTextContent = $$$hostConfig.shouldSetTextContent;
export const createTextInstance = $$$hostConfig.createTextInstance;
export const scheduleTimeout = $$$hostConfig.scheduleTimeout;
export const cancelTimeout = $$$hostConfig.cancelTimeout;
export const noTimeout = $$$hostConfig.noTimeout;
export const isPrimaryRenderer = $$$hostConfig.isPrimaryRenderer;
export const warnsIfNotActing = $$$hostConfig.warnsIfNotActing;
export const supportsMutation = $$$hostConfig.supportsMutation;
export const supportsPersistence = $$$hostConfig.supportsPersistence;
export const supportsHydration = $$$hostConfig.supportsHydration;
export const getInstanceFromNode = $$$hostConfig.getInstanceFromNode;
export const beforeActiveInstanceBlur = $$$hostConfig.beforeActiveInstanceBlur;
export const afterActiveInstanceBlur = $$$hostConfig.afterActiveInstanceBlur;
export const preparePortalMount = $$$hostConfig.preparePortalMount;
export const prepareScopeUpdate = $$$hostConfig.prepareScopeUpdate;
export const getInstanceFromScope = $$$hostConfig.getInstanceFromScope;
export const getCurrentEventPriority = $$$hostConfig.getCurrentEventPriority;
export const detachDeletedInstance = $$$hostConfig.detachDeletedInstance;
export const requestPostPaintCallback = $$$hostConfig.requestPostPaintCallback;
export const maySuspendCommit = $$$hostConfig.maySuspendCommit;
export const preloadInstance = $$$hostConfig.preloadInstance;
export const startSuspendingCommit = $$$hostConfig.startSuspendingCommit;
export const suspendInstance = $$$hostConfig.suspendInstance;
export const waitForCommitToBeReady = $$$hostConfig.waitForCommitToBeReady;
export const prepareRendererToRender = $$$hostConfig.prepareRendererToRender;
export const resetRendererAfterRender = $$$hostConfig.resetRendererAfterRender;

// -------------------
//      Microtasks
//     (optional)
// -------------------
export const supportsMicrotasks = $$$hostConfig.supportsMicrotasks;
export const scheduleMicrotask = $$$hostConfig.scheduleMicrotask;

// -------------------
//      Test selectors
//     (optional)
// -------------------
export const supportsTestSelectors = $$$hostConfig.supportsTestSelectors;
export const findFiberRoot = $$$hostConfig.findFiberRoot;
export const getBoundingRect = $$$hostConfig.getBoundingRect;
export const getTextContent = $$$hostConfig.getTextContent;
export const isHiddenSubtree = $$$hostConfig.isHiddenSubtree;
export const matchAccessibilityRole = $$$hostConfig.matchAccessibilityRole;
export const setFocusIfFocusable = $$$hostConfig.setFocusIfFocusable;
export const setupIntersectionObserver =
  $$$hostConfig.setupIntersectionObserver;

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
export const clearContainer = $$$hostConfig.clearContainer;

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
export const isHydratableType = $$$hostConfig.isHydratableType;
export const isHydratableText = $$$hostConfig.isHydratableText;
export const isSuspenseInstancePending =
  $$$hostConfig.isSuspenseInstancePending;
export const isSuspenseInstanceFallback =
  $$$hostConfig.isSuspenseInstanceFallback;
export const getSuspenseInstanceFallbackErrorDetails =
  $$$hostConfig.getSuspenseInstanceFallbackErrorDetails;
export const registerSuspenseInstanceRetry =
  $$$hostConfig.registerSuspenseInstanceRetry;
export const getNextHydratableSibling = $$$hostConfig.getNextHydratableSibling;
export const getFirstHydratableChild = $$$hostConfig.getFirstHydratableChild;
export const getFirstHydratableChildWithinContainer =
  $$$hostConfig.getFirstHydratableChildWithinContainer;
export const getFirstHydratableChildWithinSuspenseInstance =
  $$$hostConfig.getFirstHydratableChildWithinSuspenseInstance;
export const shouldSkipHydratableForInstance =
  $$$hostConfig.shouldSkipHydratableForInstance;
export const shouldSkipHydratableForTextInstance =
  $$$hostConfig.shouldSkipHydratableForTextInstance;
export const shouldSkipHydratableForSuspenseInstance =
  $$$hostConfig.shouldSkipHydratableForSuspenseInstance;
export const canHydrateInstance = $$$hostConfig.canHydrateInstance;
export const canHydrateTextInstance = $$$hostConfig.canHydrateTextInstance;
export const canHydrateSuspenseInstance =
  $$$hostConfig.canHydrateSuspenseInstance;
export const hydrateInstance = $$$hostConfig.hydrateInstance;
export const hydrateTextInstance = $$$hostConfig.hydrateTextInstance;
export const hydrateSuspenseInstance = $$$hostConfig.hydrateSuspenseInstance;
export const getNextHydratableInstanceAfterSuspenseInstance =
  $$$hostConfig.getNextHydratableInstanceAfterSuspenseInstance;
export const commitHydratedContainer = $$$hostConfig.commitHydratedContainer;
export const commitHydratedSuspenseInstance =
  $$$hostConfig.commitHydratedSuspenseInstance;
export const clearSuspenseBoundary = $$$hostConfig.clearSuspenseBoundary;
export const clearSuspenseBoundaryFromContainer =
  $$$hostConfig.clearSuspenseBoundaryFromContainer;
export const shouldDeleteUnhydratedTailInstances =
  $$$hostConfig.shouldDeleteUnhydratedTailInstances;
export const didNotMatchHydratedContainerTextInstance =
  $$$hostConfig.didNotMatchHydratedContainerTextInstance;
export const didNotMatchHydratedTextInstance =
  $$$hostConfig.didNotMatchHydratedTextInstance;
export const didNotHydrateInstanceWithinContainer =
  $$$hostConfig.didNotHydrateInstanceWithinContainer;
export const didNotHydrateInstanceWithinSuspenseInstance =
  $$$hostConfig.didNotHydrateInstanceWithinSuspenseInstance;
export const didNotHydrateInstance = $$$hostConfig.didNotHydrateInstance;
export const didNotFindHydratableInstanceWithinContainer =
  $$$hostConfig.didNotFindHydratableInstanceWithinContainer;
export const didNotFindHydratableTextInstanceWithinContainer =
  $$$hostConfig.didNotFindHydratableTextInstanceWithinContainer;
export const didNotFindHydratableSuspenseInstanceWithinContainer =
  $$$hostConfig.didNotFindHydratableSuspenseInstanceWithinContainer;
export const didNotFindHydratableInstanceWithinSuspenseInstance =
  $$$hostConfig.didNotFindHydratableInstanceWithinSuspenseInstance;
export const didNotFindHydratableTextInstanceWithinSuspenseInstance =
  $$$hostConfig.didNotFindHydratableTextInstanceWithinSuspenseInstance;
export const didNotFindHydratableSuspenseInstanceWithinSuspenseInstance =
  $$$hostConfig.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance;
export const didNotFindHydratableInstance =
  $$$hostConfig.didNotFindHydratableInstance;
export const didNotFindHydratableTextInstance =
  $$$hostConfig.didNotFindHydratableTextInstance;
export const didNotFindHydratableSuspenseInstance =
  $$$hostConfig.didNotFindHydratableSuspenseInstance;
export const errorHydratingContainer = $$$hostConfig.errorHydratingContainer;

// -------------------
//     Resources
//     (optional)
// -------------------
export type HoistableRoot = mixed;
export type Resource = mixed; // eslint-disable-line no-undef
export const supportsResources = $$$hostConfig.supportsResources;
export const isHostHoistableType = $$$hostConfig.isHostHoistableType;
export const getHoistableRoot = $$$hostConfig.getHoistableRoot;
export const getResource = $$$hostConfig.getResource;
export const acquireResource = $$$hostConfig.acquireResource;
export const releaseResource = $$$hostConfig.releaseResource;
export const hydrateHoistable = $$$hostConfig.hydrateHoistable;
export const mountHoistable = $$$hostConfig.mountHoistable;
export const unmountHoistable = $$$hostConfig.unmountHoistable;
export const createHoistableInstance = $$$hostConfig.createHoistableInstance;
export const prepareToCommitHoistables =
  $$$hostConfig.prepareToCommitHoistables;
export const mayResourceSuspendCommit = $$$hostConfig.mayResourceSuspendCommit;
export const preloadResource = $$$hostConfig.preloadResource;
export const suspendResource = $$$hostConfig.suspendResource;

// -------------------
//     Singletons
//     (optional)
// -------------------
export const supportsSingletons = $$$hostConfig.supportsSingletons;
export const resolveSingletonInstance = $$$hostConfig.resolveSingletonInstance;
export const clearSingleton = $$$hostConfig.clearSingleton;
export const acquireSingletonInstance = $$$hostConfig.acquireSingletonInstance;
export const releaseSingletonInstance = $$$hostConfig.releaseSingletonInstance;
export const isHostSingletonType = $$$hostConfig.isHostSingletonType;
