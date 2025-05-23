/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  InspectorData,
  TouchedViewDataAtPoint,
  ViewConfig,
} from './ReactNativeTypes';
import {create, diff} from './ReactNativeAttributePayloadFabric';
import {dispatchEvent} from './ReactFabricEventEmitter';
import {
  NoEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  IdleEventPriority,
  type EventPriority,
} from 'react-reconciler/src/ReactEventPriorities';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import {HostText} from 'react-reconciler/src/ReactWorkTags';
import {
  getInstanceFromHostFiber,
  traverseFragmentInstance,
} from 'react-reconciler/src/ReactFiberTreeReflection';

// Modules provided by RN:
import {
  ReactNativeViewConfigRegistry,
  deepFreezeAndThrowOnMutationInDev,
  createPublicInstance,
  createPublicTextInstance,
  type PublicInstance as ReactNativePublicInstance,
  type PublicTextInstance,
  type PublicRootInstance,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

const {
  createNode,
  cloneNodeWithNewChildren,
  cloneNodeWithNewChildrenAndProps,
  cloneNodeWithNewProps,
  createChildSet: createChildNodeSet,
  appendChild: appendChildNode,
  appendChildToSet: appendChildNodeToSet,
  completeRoot,
  registerEventHandler,
  unstable_DefaultEventPriority: FabricDefaultPriority,
  unstable_DiscreteEventPriority: FabricDiscretePriority,
  unstable_ContinuousEventPriority: FabricContinuousPriority,
  unstable_IdleEventPriority: FabricIdlePriority,
  unstable_getCurrentEventPriority: fabricGetCurrentEventPriority,
} = nativeFabricUIManager;

import {getClosestInstanceFromNode} from './ReactFabricComponentTree';

import {
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
  getInspectorDataForInstance,
} from './ReactNativeFiberInspector';

import {
  passChildrenWhenCloningPersistedNodes,
  enableLazyPublicInstanceInFabric,
} from 'shared/ReactFeatureFlags';
import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';
import type {ReactContext} from 'shared/ReactTypes';

export {default as rendererVersion} from 'shared/ReactVersion'; // TODO: Consider exporting the react-native version.
export const rendererPackageName = 'react-native-renderer';
export const extraDevToolsConfig = {
  getInspectorDataForInstance,
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
};

const {get: getViewConfigForType} = ReactNativeViewConfigRegistry;

// Counter for uniquely identifying views.
// % 10 === 1 means it is a rootTag.
// % 2 === 0 means it is a Fabric tag.
// This means that they never overlap.
let nextReactTag = 2;

type InternalInstanceHandle = Object;
type Node = Object;
export type Type = string;
export type Props = Object;
export type Instance = {
  // Reference to the shadow node.
  node: Node,
  // This object is shared by all the clones of the instance.
  // We use it to access their shared public instance (exposed through refs)
  // and to access its committed state for events, etc.
  canonical: {
    nativeTag: number,
    viewConfig: ViewConfig,
    currentProps: Props,
    // Reference to the React handle (the fiber)
    internalInstanceHandle: InternalInstanceHandle,
    // Exposed through refs. Potentially lazily created.
    publicInstance: PublicInstance | null,
    // This is only necessary to lazily create `publicInstance`.
    // Will be set to `null` after that is created.
    publicRootInstance?: PublicRootInstance | null,
  },
};
export type TextInstance = {
  // Reference to the shadow node.
  node: Node,
  // Text instances are never cloned, so we don't need to keep a "canonical"
  // reference to make sure all clones of the instance point to the same values.
  publicInstance?: PublicTextInstance,
};
export type HydratableInstance = Instance | TextInstance;
export type PublicInstance = ReactNativePublicInstance;
export type Container = {
  containerTag: number,
  publicInstance: PublicRootInstance | null,
};
export type ChildSet = Object | Array<Node>;
export type HostContext = $ReadOnly<{
  isInAParentText: boolean,
}>;
export type UpdatePayload = Object;

export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;
export type TransitionStatus = mixed;

export type RendererInspectionConfig = $ReadOnly<{
  getInspectorDataForInstance?: (instance: Fiber | null) => InspectorData,
  // Deprecated. Replaced with getInspectorDataForViewAtPoint.
  getInspectorDataForViewTag?: (tag: number) => Object,
  getInspectorDataForViewAtPoint?: (
    inspectedView: Object,
    locationX: number,
    locationY: number,
    callback: (viewData: TouchedViewDataAtPoint) => mixed,
  ) => void,
}>;

// TODO: Remove this conditional once all changes have propagated.
if (registerEventHandler) {
  /**
   * Register the event emitter with the native bridge
   */
  registerEventHandler(dispatchEvent);
}

export * from 'react-reconciler/src/ReactFiberConfigWithNoMutation';
export * from 'react-reconciler/src/ReactFiberConfigWithNoHydration';
export * from 'react-reconciler/src/ReactFiberConfigWithNoScopes';
export * from 'react-reconciler/src/ReactFiberConfigWithNoTestSelectors';
export * from 'react-reconciler/src/ReactFiberConfigWithNoResources';
export * from 'react-reconciler/src/ReactFiberConfigWithNoSingletons';

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  appendChildNode(parentInstance.node, child.node);
}

const PROD_HOST_CONTEXT: HostContext = {isInAParentText: true};

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: InternalInstanceHandle,
): Instance {
  const tag = nextReactTag;
  nextReactTag += 2;

  const viewConfig = getViewConfigForType(type);

  if (__DEV__) {
    for (const key in viewConfig.validAttributes) {
      if (props.hasOwnProperty(key)) {
        deepFreezeAndThrowOnMutationInDev(props[key]);
      }
    }
  }

  const updatePayload = create(props, viewConfig.validAttributes);

  const node = createNode(
    tag, // reactTag
    viewConfig.uiViewClassName, // viewName
    rootContainerInstance.containerTag, // rootTag
    updatePayload, // props
    internalInstanceHandle, // internalInstanceHandle
  );

  if (enableLazyPublicInstanceInFabric) {
    return {
      node: node,
      canonical: {
        nativeTag: tag,
        viewConfig,
        currentProps: props,
        internalInstanceHandle,
        publicInstance: null,
        publicRootInstance: rootContainerInstance.publicInstance,
      },
    };
  } else {
    const component = createPublicInstance(
      tag,
      viewConfig,
      internalInstanceHandle,
      rootContainerInstance.publicInstance,
    );

    return {
      node: node,
      canonical: {
        nativeTag: tag,
        viewConfig,
        currentProps: props,
        internalInstanceHandle,
        publicInstance: component,
      },
    };
  }
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: InternalInstanceHandle,
): TextInstance {
  if (__DEV__) {
    if (!hostContext.isInAParentText) {
      console.error('Text strings must be rendered within a <Text> component.');
    }
  }

  const tag = nextReactTag;
  nextReactTag += 2;

  const node = createNode(
    tag, // reactTag
    'RCTRawText', // viewName
    rootContainerInstance.containerTag, // rootTag
    {text: text}, // props
    internalInstanceHandle, // instance handle
  );

  return {
    node: node,
  };
}

export function finalizeInitialChildren(
  parentInstance: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
): boolean {
  return false;
}

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  if (__DEV__) {
    return {isInAParentText: false};
  }

  return PROD_HOST_CONTEXT;
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
): HostContext {
  if (__DEV__) {
    const prevIsInAParentText = parentHostContext.isInAParentText;
    const isInAParentText =
      type === 'AndroidTextInput' || // Android
      type === 'RCTMultilineTextInputView' || // iOS
      type === 'RCTSinglelineTextInputView' || // iOS
      type === 'RCTText' ||
      type === 'RCTVirtualText';

    // TODO: If this is an offscreen host container, we should reuse the
    // parent context.

    if (prevIsInAParentText !== isInAParentText) {
      return {isInAParentText};
    }
  }

  return parentHostContext;
}

export function getPublicInstance(instance: Instance): null | PublicInstance {
  if (instance.canonical != null) {
    if (instance.canonical.publicInstance == null) {
      instance.canonical.publicInstance = createPublicInstance(
        instance.canonical.nativeTag,
        instance.canonical.viewConfig,
        instance.canonical.internalInstanceHandle,
        instance.canonical.publicRootInstance ?? null,
      );
      // This was only necessary to create the public instance.
      instance.canonical.publicRootInstance = null;
    }

    return instance.canonical.publicInstance;
  }

  // For compatibility with the legacy renderer, in case it's used with Fabric
  // in the same app.
  // $FlowExpectedError[prop-missing]
  if (instance._nativeTag != null) {
    // $FlowExpectedError[incompatible-return]
    return instance;
  }

  return null;
}

function getPublicTextInstance(
  textInstance: TextInstance,
  internalInstanceHandle: InternalInstanceHandle,
): PublicTextInstance {
  if (textInstance.publicInstance == null) {
    textInstance.publicInstance = createPublicTextInstance(
      internalInstanceHandle,
    );
  }
  return textInstance.publicInstance;
}

export function getPublicInstanceFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): null | PublicInstance | PublicTextInstance {
  const instance = internalInstanceHandle.stateNode;

  // React resets all the fields in the fiber when the component is unmounted
  // to prevent memory leaks.
  if (instance == null) {
    return null;
  }

  if (internalInstanceHandle.tag === HostText) {
    const textInstance: TextInstance = instance;
    return getPublicTextInstance(textInstance, internalInstanceHandle);
  }

  const elementInstance: Instance = internalInstanceHandle.stateNode;
  return getPublicInstance(elementInstance);
}

export function prepareForCommit(containerInfo: Container): null | Object {
  // Noop
  return null;
}

export function resetAfterCommit(containerInfo: Container): void {
  // Noop
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  // TODO (bvaughn) Revisit this decision.
  // Always returning false simplifies the createInstance() implementation,
  // But creates an additional child Fiber for raw text children.
  // No additional native views are created though.
  // It's not clear to me which is better so I'm deferring for now.
  // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
  return false;
}

let currentUpdatePriority: EventPriority = NoEventPriority;
export function setCurrentUpdatePriority(newPriority: EventPriority): void {
  currentUpdatePriority = newPriority;
}

export function getCurrentUpdatePriority(): EventPriority {
  return currentUpdatePriority;
}

export function resolveUpdatePriority(): EventPriority {
  if (currentUpdatePriority !== NoEventPriority) {
    return currentUpdatePriority;
  }

  const currentEventPriority = fabricGetCurrentEventPriority
    ? fabricGetCurrentEventPriority()
    : null;

  if (currentEventPriority != null) {
    switch (currentEventPriority) {
      case FabricDiscretePriority:
        return DiscreteEventPriority;
      case FabricContinuousPriority:
        return ContinuousEventPriority;
      case FabricIdlePriority:
        return IdleEventPriority;
      case FabricDefaultPriority:
      default:
        return DefaultEventPriority;
    }
  }

  return DefaultEventPriority;
}

export function trackSchedulerEvent(): void {}

export function resolveEventType(): null | string {
  return null;
}

export function resolveEventTimeStamp(): number {
  return -1.1;
}

export function shouldAttemptEagerTransition(): boolean {
  return false;
}

// The Fabric renderer is secondary to the existing React Native renderer.
export const isPrimaryRenderer = false;

// The Fabric renderer shouldn't trigger missing act() warnings
export const warnsIfNotActing = false;

export const scheduleTimeout = setTimeout;
export const cancelTimeout = clearTimeout;
export const noTimeout = -1;

// -------------------
//     Persistence
// -------------------

export const supportsPersistence = true;

export function cloneInstance(
  instance: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  keepChildren: boolean,
  newChildSet: ?ChildSet,
): Instance {
  const viewConfig = instance.canonical.viewConfig;
  const updatePayload = diff(oldProps, newProps, viewConfig.validAttributes);
  // TODO: If the event handlers have changed, we need to update the current props
  // in the commit phase but there is no host config hook to do it yet.
  // So instead we hack it by updating it in the render phase.
  instance.canonical.currentProps = newProps;

  const node = instance.node;
  let clone;
  if (keepChildren) {
    if (updatePayload !== null) {
      clone = cloneNodeWithNewProps(node, updatePayload);
    } else {
      // No changes
      return instance;
    }
  } else {
    // If passChildrenWhenCloningPersistedNodes is enabled, children will be non-null
    if (newChildSet != null) {
      if (updatePayload !== null) {
        clone = cloneNodeWithNewChildrenAndProps(
          node,
          newChildSet,
          updatePayload,
        );
      } else {
        clone = cloneNodeWithNewChildren(node, newChildSet);
      }
    } else {
      if (updatePayload !== null) {
        clone = cloneNodeWithNewChildrenAndProps(node, updatePayload);
      } else {
        clone = cloneNodeWithNewChildren(node);
      }
    }
  }

  return {
    node: clone,
    canonical: instance.canonical,
  };
}

export function cloneHiddenInstance(
  instance: Instance,
  type: string,
  props: Props,
): Instance {
  const viewConfig = instance.canonical.viewConfig;
  const node = instance.node;
  const updatePayload = create(
    {style: {display: 'none'}},
    viewConfig.validAttributes,
  );
  return {
    node: cloneNodeWithNewProps(node, updatePayload),
    canonical: instance.canonical,
  };
}

export function cloneHiddenTextInstance(
  instance: Instance,
  text: string,
): TextInstance {
  throw new Error('Not yet implemented.');
}

export function createContainerChildSet(): ChildSet {
  if (passChildrenWhenCloningPersistedNodes) {
    return [];
  } else {
    return createChildNodeSet();
  }
}

export function appendChildToContainerChildSet(
  childSet: ChildSet,
  child: Instance | TextInstance,
): void {
  if (passChildrenWhenCloningPersistedNodes) {
    childSet.push(child.node);
  } else {
    appendChildNodeToSet(childSet, child.node);
  }
}

export function finalizeContainerChildren(
  container: Container,
  newChildren: ChildSet,
): void {
  // Noop - children will be replaced in replaceContainerChildren
}

export function replaceContainerChildren(
  container: Container,
  newChildren: ChildSet,
): void {
  completeRoot(container.containerTag, newChildren);
}

export {getClosestInstanceFromNode as getInstanceFromNode};

export function beforeActiveInstanceBlur(
  internalInstanceHandle: InternalInstanceHandle,
) {
  // noop
}

export function afterActiveInstanceBlur() {
  // noop
}

export function preparePortalMount(portalInstance: Instance): void {
  // noop
}

export function detachDeletedInstance(node: Instance): void {
  // noop
}

export function requestPostPaintCallback(callback: (time: number) => void) {
  // noop
}

export function maySuspendCommit(type: Type, props: Props): boolean {
  return false;
}

export function maySuspendCommitOnUpdate(
  type: Type,
  oldProps: Props,
  newProps: Props,
): boolean {
  return false;
}

export function maySuspendCommitInSyncRender(
  type: Type,
  props: Props,
): boolean {
  return false;
}

export function preloadInstance(
  instance: Instance,
  type: Type,
  props: Props,
): boolean {
  return true;
}

export function startSuspendingCommit(): void {}

export function suspendInstance(
  instance: Instance,
  type: Type,
  props: Props,
): void {}

export function suspendOnActiveViewTransition(container: Container): void {}

export function waitForCommitToBeReady(): null {
  return null;
}

export type FragmentInstanceType = {
  _fragmentFiber: Fiber,
  _observers: null | Set<IntersectionObserver>,
  observeUsing: (observer: IntersectionObserver) => void,
  unobserveUsing: (observer: IntersectionObserver) => void,
};

function FragmentInstance(this: FragmentInstanceType, fragmentFiber: Fiber) {
  this._fragmentFiber = fragmentFiber;
  this._observers = null;
}

// $FlowFixMe[prop-missing]
FragmentInstance.prototype.observeUsing = function (
  this: FragmentInstanceType,
  observer: IntersectionObserver,
): void {
  if (this._observers === null) {
    this._observers = new Set();
  }
  this._observers.add(observer);
  traverseFragmentInstance(this._fragmentFiber, observeChild, observer);
};
function observeChild(child: Fiber, observer: IntersectionObserver) {
  const instance = getInstanceFromHostFiber<Instance>(child);
  const publicInstance = getPublicInstance(instance);
  if (publicInstance == null) {
    throw new Error('Expected to find a host node. This is a bug in React.');
  }
  // $FlowFixMe[incompatible-call] Element types are behind a flag in RN
  observer.observe(publicInstance);
  return false;
}
// $FlowFixMe[prop-missing]
FragmentInstance.prototype.unobserveUsing = function (
  this: FragmentInstanceType,
  observer: IntersectionObserver,
): void {
  if (this._observers === null || !this._observers.has(observer)) {
    if (__DEV__) {
      console.error(
        'You are calling unobserveUsing() with an observer that is not being observed with this fragment ' +
          'instance. First attach the observer with observeUsing()',
      );
    }
  } else {
    this._observers.delete(observer);
    traverseFragmentInstance(this._fragmentFiber, unobserveChild, observer);
  }
};
function unobserveChild(child: Fiber, observer: IntersectionObserver) {
  const instance = getInstanceFromHostFiber<Instance>(child);
  const publicInstance = getPublicInstance(instance);
  if (publicInstance == null) {
    throw new Error('Expected to find a host node. This is a bug in React.');
  }
  // $FlowFixMe[incompatible-call] Element types are behind a flag in RN
  observer.unobserve(publicInstance);
  return false;
}

export function createFragmentInstance(
  fragmentFiber: Fiber,
): FragmentInstanceType {
  return new (FragmentInstance: any)(fragmentFiber);
}

export function updateFragmentInstanceFiber(
  fragmentFiber: Fiber,
  instance: FragmentInstanceType,
): void {
  instance._fragmentFiber = fragmentFiber;
}

export function commitNewChildToFragmentInstance(
  childInstance: Instance,
  fragmentInstance: FragmentInstanceType,
): void {
  const publicInstance = getPublicInstance(childInstance);
  if (fragmentInstance._observers !== null) {
    if (publicInstance == null) {
      throw new Error('Expected to find a host node. This is a bug in React.');
    }
    fragmentInstance._observers.forEach(observer => {
      // $FlowFixMe[incompatible-call] Element types are behind a flag in RN
      observer.observe(publicInstance);
    });
  }
}

export function deleteChildFromFragmentInstance(
  child: Instance,
  fragmentInstance: FragmentInstanceType,
): void {
  // Noop
}

export const NotPendingTransition: TransitionStatus = null;
export const HostTransitionContext: ReactContext<TransitionStatus> = {
  $$typeof: REACT_CONTEXT_TYPE,
  Provider: (null: any),
  Consumer: (null: any),
  _currentValue: NotPendingTransition,
  _currentValue2: NotPendingTransition,
  _threadCount: 0,
};

export type FormInstance = Instance;
export function resetFormInstance(form: Instance): void {}

// -------------------
//     Microtasks
// -------------------

export const supportsMicrotasks: boolean =
  typeof RN$enableMicrotasksInReact !== 'undefined' &&
  !!RN$enableMicrotasksInReact;

export const scheduleMicrotask: any =
  typeof queueMicrotask === 'function' ? queueMicrotask : scheduleTimeout;
