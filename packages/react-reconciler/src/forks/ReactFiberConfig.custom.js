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

declare var $$$config: any;
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
export opaque type TransitionStatus = mixed; // eslint-disable-line no-undef
export type EventResponder = any;

export const getPublicInstance = $$$config.getPublicInstance;
export const getRootHostContext = $$$config.getRootHostContext;
export const getChildHostContext = $$$config.getChildHostContext;
export const prepareForCommit = $$$config.prepareForCommit;
export const resetAfterCommit = $$$config.resetAfterCommit;
export const createInstance = $$$config.createInstance;
export const appendInitialChild = $$$config.appendInitialChild;
export const finalizeInitialChildren = $$$config.finalizeInitialChildren;
export const prepareUpdate = $$$config.prepareUpdate;
export const shouldSetTextContent = $$$config.shouldSetTextContent;
export const createTextInstance = $$$config.createTextInstance;
export const scheduleTimeout = $$$config.scheduleTimeout;
export const cancelTimeout = $$$config.cancelTimeout;
export const noTimeout = $$$config.noTimeout;
export const isPrimaryRenderer = $$$config.isPrimaryRenderer;
export const warnsIfNotActing = $$$config.warnsIfNotActing;
export const supportsMutation = $$$config.supportsMutation;
export const supportsPersistence = $$$config.supportsPersistence;
export const supportsHydration = $$$config.supportsHydration;
export const getInstanceFromNode = $$$config.getInstanceFromNode;
export const beforeActiveInstanceBlur = $$$config.beforeActiveInstanceBlur;
export const afterActiveInstanceBlur = $$$config.afterActiveInstanceBlur;
export const preparePortalMount = $$$config.preparePortalMount;
export const prepareScopeUpdate = $$$config.prepareScopeUpdate;
export const getInstanceFromScope = $$$config.getInstanceFromScope;
export const getCurrentEventPriority = $$$config.getCurrentEventPriority;
export const shouldAttemptEagerTransition =
  $$$config.shouldAttemptEagerTransition;
export const detachDeletedInstance = $$$config.detachDeletedInstance;
export const requestPostPaintCallback = $$$config.requestPostPaintCallback;
export const maySuspendCommit = $$$config.maySuspendCommit;
export const preloadInstance = $$$config.preloadInstance;
export const startSuspendingCommit = $$$config.startSuspendingCommit;
export const suspendInstance = $$$config.suspendInstance;
export const waitForCommitToBeReady = $$$config.waitForCommitToBeReady;
export const NotPendingTransition = $$$config.NotPendingTransition;

// -------------------
//      Microtasks
//     (optional)
// -------------------
export const supportsMicrotasks = $$$config.supportsMicrotasks;
export const scheduleMicrotask = $$$config.scheduleMicrotask;

// -------------------
//      Test selectors
//     (optional)
// -------------------
export const supportsTestSelectors = $$$config.supportsTestSelectors;
export const findFiberRoot = $$$config.findFiberRoot;
export const getBoundingRect = $$$config.getBoundingRect;
export const getTextContent = $$$config.getTextContent;
export const isHiddenSubtree = $$$config.isHiddenSubtree;
export const matchAccessibilityRole = $$$config.matchAccessibilityRole;
export const setFocusIfFocusable = $$$config.setFocusIfFocusable;
export const setupIntersectionObserver = $$$config.setupIntersectionObserver;

// -------------------
//      Mutation
//     (optional)
// -------------------
export const appendChild = $$$config.appendChild;
export const appendChildToContainer = $$$config.appendChildToContainer;
export const commitTextUpdate = $$$config.commitTextUpdate;
export const commitMount = $$$config.commitMount;
export const commitUpdate = $$$config.commitUpdate;
export const insertBefore = $$$config.insertBefore;
export const insertInContainerBefore = $$$config.insertInContainerBefore;
export const removeChild = $$$config.removeChild;
export const removeChildFromContainer = $$$config.removeChildFromContainer;
export const resetTextContent = $$$config.resetTextContent;
export const hideInstance = $$$config.hideInstance;
export const hideTextInstance = $$$config.hideTextInstance;
export const unhideInstance = $$$config.unhideInstance;
export const unhideTextInstance = $$$config.unhideTextInstance;
export const clearContainer = $$$config.clearContainer;

// -------------------
//     Persistence
//     (optional)
// -------------------
export const cloneInstance = $$$config.cloneInstance;
export const createContainerChildSet = $$$config.createContainerChildSet;
export const appendChildToContainerChildSet =
  $$$config.appendChildToContainerChildSet;
export const finalizeContainerChildren = $$$config.finalizeContainerChildren;
export const replaceContainerChildren = $$$config.replaceContainerChildren;
export const cloneHiddenInstance = $$$config.cloneHiddenInstance;
export const cloneHiddenTextInstance = $$$config.cloneHiddenTextInstance;

// -------------------
//     Hydration
//     (optional)
// -------------------
export const isHydratableType = $$$config.isHydratableType;
export const isHydratableText = $$$config.isHydratableText;
export const isSuspenseInstancePending = $$$config.isSuspenseInstancePending;
export const isSuspenseInstanceFallback = $$$config.isSuspenseInstanceFallback;
export const getSuspenseInstanceFallbackErrorDetails =
  $$$config.getSuspenseInstanceFallbackErrorDetails;
export const registerSuspenseInstanceRetry =
  $$$config.registerSuspenseInstanceRetry;
export const getNextHydratableSibling = $$$config.getNextHydratableSibling;
export const getFirstHydratableChild = $$$config.getFirstHydratableChild;
export const getFirstHydratableChildWithinContainer =
  $$$config.getFirstHydratableChildWithinContainer;
export const getFirstHydratableChildWithinSuspenseInstance =
  $$$config.getFirstHydratableChildWithinSuspenseInstance;
export const canHydrateInstance = $$$config.canHydrateInstance;
export const canHydrateTextInstance = $$$config.canHydrateTextInstance;
export const canHydrateSuspenseInstance = $$$config.canHydrateSuspenseInstance;
export const hydrateInstance = $$$config.hydrateInstance;
export const hydrateTextInstance = $$$config.hydrateTextInstance;
export const hydrateSuspenseInstance = $$$config.hydrateSuspenseInstance;
export const getNextHydratableInstanceAfterSuspenseInstance =
  $$$config.getNextHydratableInstanceAfterSuspenseInstance;
export const commitHydratedContainer = $$$config.commitHydratedContainer;
export const commitHydratedSuspenseInstance =
  $$$config.commitHydratedSuspenseInstance;
export const clearSuspenseBoundary = $$$config.clearSuspenseBoundary;
export const clearSuspenseBoundaryFromContainer =
  $$$config.clearSuspenseBoundaryFromContainer;
export const shouldDeleteUnhydratedTailInstances =
  $$$config.shouldDeleteUnhydratedTailInstances;
export const didNotMatchHydratedContainerTextInstance =
  $$$config.didNotMatchHydratedContainerTextInstance;
export const didNotMatchHydratedTextInstance =
  $$$config.didNotMatchHydratedTextInstance;
export const didNotHydrateInstanceWithinContainer =
  $$$config.didNotHydrateInstanceWithinContainer;
export const didNotHydrateInstanceWithinSuspenseInstance =
  $$$config.didNotHydrateInstanceWithinSuspenseInstance;
export const didNotHydrateInstance = $$$config.didNotHydrateInstance;
export const didNotFindHydratableInstanceWithinContainer =
  $$$config.didNotFindHydratableInstanceWithinContainer;
export const didNotFindHydratableTextInstanceWithinContainer =
  $$$config.didNotFindHydratableTextInstanceWithinContainer;
export const didNotFindHydratableSuspenseInstanceWithinContainer =
  $$$config.didNotFindHydratableSuspenseInstanceWithinContainer;
export const didNotFindHydratableInstanceWithinSuspenseInstance =
  $$$config.didNotFindHydratableInstanceWithinSuspenseInstance;
export const didNotFindHydratableTextInstanceWithinSuspenseInstance =
  $$$config.didNotFindHydratableTextInstanceWithinSuspenseInstance;
export const didNotFindHydratableSuspenseInstanceWithinSuspenseInstance =
  $$$config.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance;
export const didNotFindHydratableInstance =
  $$$config.didNotFindHydratableInstance;
export const didNotFindHydratableTextInstance =
  $$$config.didNotFindHydratableTextInstance;
export const didNotFindHydratableSuspenseInstance =
  $$$config.didNotFindHydratableSuspenseInstance;
export const errorHydratingContainer = $$$config.errorHydratingContainer;

// -------------------
//     Resources
//     (optional)
// -------------------
export type HoistableRoot = mixed;
export type Resource = mixed; // eslint-disable-line no-undef
export const supportsResources = $$$config.supportsResources;
export const isHostHoistableType = $$$config.isHostHoistableType;
export const getHoistableRoot = $$$config.getHoistableRoot;
export const getResource = $$$config.getResource;
export const acquireResource = $$$config.acquireResource;
export const releaseResource = $$$config.releaseResource;
export const hydrateHoistable = $$$config.hydrateHoistable;
export const mountHoistable = $$$config.mountHoistable;
export const unmountHoistable = $$$config.unmountHoistable;
export const createHoistableInstance = $$$config.createHoistableInstance;
export const prepareToCommitHoistables = $$$config.prepareToCommitHoistables;
export const mayResourceSuspendCommit = $$$config.mayResourceSuspendCommit;
export const preloadResource = $$$config.preloadResource;
export const suspendResource = $$$config.suspendResource;

// -------------------
//     Singletons
//     (optional)
// -------------------
export const supportsSingletons = $$$config.supportsSingletons;
export const resolveSingletonInstance = $$$config.resolveSingletonInstance;
export const clearSingleton = $$$config.clearSingleton;
export const acquireSingletonInstance = $$$config.acquireSingletonInstance;
export const releaseSingletonInstance = $$$config.releaseSingletonInstance;
export const isHostSingletonType = $$$config.isHostSingletonType;
