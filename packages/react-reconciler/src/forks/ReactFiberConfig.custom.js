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

declare const $$$config: any;
export opaque type Type = mixed;
export opaque type Props = mixed;
export opaque type Container = mixed;
export opaque type Instance = mixed;
export opaque type TextInstance = mixed;
export opaque type SuspenseInstance = mixed;
export opaque type HydratableInstance = mixed;
export opaque type PublicInstance = mixed;
export opaque type HostContext = mixed;
export opaque type UpdatePayload = mixed;
export opaque type ChildSet = mixed;
export opaque type TimeoutHandle = mixed;
export opaque type NoTimeout = mixed;
export opaque type RendererInspectionConfig = mixed;
export opaque type TransitionStatus = mixed;
export opaque type FormInstance = mixed;
export type EventResponder = any;

export const rendererVersion = $$$config.rendererVersion;
export const rendererPackageName = $$$config.rendererPackageName;
export const extraDevToolsConfig = $$$config.extraDevToolsConfig;

export const getPublicInstance = $$$config.getPublicInstance;
export const getRootHostContext = $$$config.getRootHostContext;
export const getChildHostContext = $$$config.getChildHostContext;
export const prepareForCommit = $$$config.prepareForCommit;
export const resetAfterCommit = $$$config.resetAfterCommit;
export const createInstance = $$$config.createInstance;
export const appendInitialChild = $$$config.appendInitialChild;
export const finalizeInitialChildren = $$$config.finalizeInitialChildren;
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
export const setCurrentUpdatePriority = $$$config.setCurrentUpdatePriority;
export const getCurrentUpdatePriority = $$$config.getCurrentUpdatePriority;
export const resolveUpdatePriority = $$$config.resolveUpdatePriority;
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
export const HostTransitionContext = $$$config.HostTransitionContext;
export const resetFormInstance = $$$config.resetFormInstance;
export const bindToConsole = $$$config.bindToConsole;

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
export const isSuspenseInstancePending = $$$config.isSuspenseInstancePending;
export const isSuspenseInstanceFallback = $$$config.isSuspenseInstanceFallback;
export const getSuspenseInstanceFallbackErrorDetails =
  $$$config.getSuspenseInstanceFallbackErrorDetails;
export const registerSuspenseInstanceRetry =
  $$$config.registerSuspenseInstanceRetry;
export const canHydrateFormStateMarker = $$$config.canHydrateFormStateMarker;
export const isFormStateMarkerMatching = $$$config.isFormStateMarkerMatching;
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
export const diffHydratedPropsForDevWarnings =
  $$$config.diffHydratedPropsForDevWarnings;
export const diffHydratedTextForDevWarnings =
  $$$config.diffHydratedTextForDevWarnings;
export const describeHydratableInstanceForDevWarnings =
  $$$config.describeHydratableInstanceForDevWarnings;
export const validateHydratableInstance = $$$config.validateHydratableInstance;
export const validateHydratableTextInstance =
  $$$config.validateHydratableTextInstance;

// -------------------
//     Resources
//     (optional)
// -------------------
export type HoistableRoot = mixed;
export type Resource = mixed;
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
