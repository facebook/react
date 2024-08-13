/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {InspectorData, TouchedViewDataAtPoint} from './ReactNativeTypes';

// Modules provided by RN:
import {
  ReactNativeViewConfigRegistry,
  UIManager,
  deepFreezeAndThrowOnMutationInDev,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {create, diff} from './ReactNativeAttributePayload';
import {
  precacheFiberNode,
  uncacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
} from './ReactNativeComponentTree';
import ReactNativeFiberHostComponent from './ReactNativeFiberHostComponent';

import {
  DefaultEventPriority,
  NoEventPriority,
  type EventPriority,
} from 'react-reconciler/src/ReactEventPriorities';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';
import type {ReactContext} from 'shared/ReactTypes';

import {
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
  getInspectorDataForInstance,
} from './ReactNativeFiberInspector';

export {default as rendererVersion} from 'shared/ReactVersion'; // TODO: Consider exporting the react-native version.
export const rendererPackageName = 'react-native-renderer';
export const extraDevToolsConfig = {
  getInspectorDataForInstance,
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
};

const {get: getViewConfigForType} = ReactNativeViewConfigRegistry;

export type Type = string;
export type Props = Object;
export type Container = number;
export type Instance = ReactNativeFiberHostComponent;
export type TextInstance = number;
export type HydratableInstance = Instance | TextInstance;
export type PublicInstance = Instance;
export type HostContext = $ReadOnly<{
  isInAParentText: boolean,
}>;
export type UpdatePayload = Object; // Unused
export type ChildSet = void; // Unused

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

// Counter for uniquely identifying views.
// % 10 === 1 means it is a rootTag.
// % 2 === 0 means it is a Fabric tag.
let nextReactTag = 3;
function allocateTag() {
  let tag = nextReactTag;
  if (tag % 10 === 1) {
    tag += 2;
  }
  nextReactTag = tag + 2;
  return tag;
}

function recursivelyUncacheFiberNode(node: Instance | TextInstance) {
  if (typeof node === 'number') {
    // Leaf node (eg text)
    uncacheFiberNode(node);
  } else {
    uncacheFiberNode((node: any)._nativeTag);

    (node: any)._children.forEach(recursivelyUncacheFiberNode);
  }
}

export * from 'react-reconciler/src/ReactFiberConfigWithNoPersistence';
export * from 'react-reconciler/src/ReactFiberConfigWithNoHydration';
export * from 'react-reconciler/src/ReactFiberConfigWithNoScopes';
export * from 'react-reconciler/src/ReactFiberConfigWithNoTestSelectors';
export * from 'react-reconciler/src/ReactFiberConfigWithNoMicrotasks';
export * from 'react-reconciler/src/ReactFiberConfigWithNoResources';
export * from 'react-reconciler/src/ReactFiberConfigWithNoSingletons';

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance._children.push(child);
}

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  const tag = allocateTag();
  const viewConfig = getViewConfigForType(type);

  if (__DEV__) {
    for (const key in viewConfig.validAttributes) {
      if (props.hasOwnProperty(key)) {
        deepFreezeAndThrowOnMutationInDev(props[key]);
      }
    }
  }

  const updatePayload = create(props, viewConfig.validAttributes);

  UIManager.createView(
    tag, // reactTag
    viewConfig.uiViewClassName, // viewName
    rootContainerInstance, // rootTag
    updatePayload, // props
  );

  const component = new ReactNativeFiberHostComponent(
    tag,
    viewConfig,
    internalInstanceHandle,
  );

  precacheFiberNode(internalInstanceHandle, tag);
  updateFiberProps(tag, props);

  // Not sure how to avoid this cast. Flow is okay if the component is defined
  // in the same file but if it's external it can't see the types.
  return ((component: any): Instance);
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): TextInstance {
  if (!hostContext.isInAParentText) {
    throw new Error('Text strings must be rendered within a <Text> component.');
  }

  const tag = allocateTag();

  UIManager.createView(
    tag, // reactTag
    'RCTRawText', // viewName
    rootContainerInstance, // rootTag
    {text: text}, // props
  );

  precacheFiberNode(internalInstanceHandle, tag);

  return tag;
}

export function finalizeInitialChildren(
  parentInstance: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
): boolean {
  // Don't send a no-op message over the bridge.
  if (parentInstance._children.length === 0) {
    return false;
  }

  // Map from child objects to native tags.
  // Either way we need to pass a copy of the Array to prevent it from being frozen.
  const nativeTags = parentInstance._children.map(child =>
    typeof child === 'number'
      ? child // Leaf node (eg text)
      : child._nativeTag,
  );

  UIManager.setChildren(
    parentInstance._nativeTag, // containerTag
    nativeTags, // reactTags
  );

  return false;
}

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  return {isInAParentText: false};
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
): HostContext {
  const prevIsInAParentText = parentHostContext.isInAParentText;
  const isInAParentText =
    type === 'AndroidTextInput' || // Android
    type === 'RCTMultilineTextInputView' || // iOS
    type === 'RCTSinglelineTextInputView' || // iOS
    type === 'RCTText' ||
    type === 'RCTVirtualText';

  if (prevIsInAParentText !== isInAParentText) {
    return {isInAParentText};
  } else {
    return parentHostContext;
  }
}

export function getPublicInstance(instance: Instance): PublicInstance {
  // $FlowExpectedError[prop-missing] For compatibility with Fabric
  if (instance.canonical != null && instance.canonical.publicInstance != null) {
    // $FlowFixMe[incompatible-return]
    return instance.canonical.publicInstance;
  }

  return instance;
}

export function prepareForCommit(containerInfo: Container): null | Object {
  // Noop
  return null;
}

export function resetAfterCommit(containerInfo: Container): void {
  // Noop
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;

export const scheduleTimeout = setTimeout;
export const cancelTimeout = clearTimeout;
export const noTimeout = -1;

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
  return DefaultEventPriority;
}

export function shouldAttemptEagerTransition(): boolean {
  return false;
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  const childTag = typeof child === 'number' ? child : child._nativeTag;
  const children = parentInstance._children;
  const index = children.indexOf(child);

  if (index >= 0) {
    children.splice(index, 1);
    children.push(child);

    UIManager.manageChildren(
      parentInstance._nativeTag, // containerTag
      [index], // moveFromIndices
      [children.length - 1], // moveToIndices
      [], // addChildReactTags
      [], // addAtIndices
      [], // removeAtIndices
    );
  } else {
    children.push(child);

    UIManager.manageChildren(
      parentInstance._nativeTag, // containerTag
      [], // moveFromIndices
      [], // moveToIndices
      [childTag], // addChildReactTags
      [children.length - 1], // addAtIndices
      [], // removeAtIndices
    );
  }
}

export function appendChildToContainer(
  parentInstance: Container,
  child: Instance | TextInstance,
): void {
  const childTag = typeof child === 'number' ? child : child._nativeTag;
  UIManager.setChildren(
    parentInstance, // containerTag
    [childTag], // reactTags
  );
}

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string,
): void {
  UIManager.updateView(
    textInstance, // reactTag
    'RCTRawText', // viewName
    {text: newText}, // props
  );
}

export function commitMount(
  instance: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Noop
}

export function commitUpdate(
  instance: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  const viewConfig = instance.viewConfig;

  updateFiberProps(instance._nativeTag, newProps);

  const updatePayload = diff(oldProps, newProps, viewConfig.validAttributes);

  // Avoid the overhead of bridge calls if there's no update.
  // This is an expensive no-op for Android, and causes an unnecessary
  // view invalidation for certain components (eg RCTTextInput) on iOS.
  if (updatePayload != null) {
    UIManager.updateView(
      instance._nativeTag, // reactTag
      viewConfig.uiViewClassName, // viewName
      updatePayload, // props
    );
  }
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  const children = (parentInstance: any)._children;
  const index = children.indexOf(child);

  // Move existing child or add new child?
  if (index >= 0) {
    children.splice(index, 1);
    const beforeChildIndex = children.indexOf(beforeChild);
    children.splice(beforeChildIndex, 0, child);

    UIManager.manageChildren(
      (parentInstance: any)._nativeTag, // containerID
      [index], // moveFromIndices
      [beforeChildIndex], // moveToIndices
      [], // addChildReactTags
      [], // addAtIndices
      [], // removeAtIndices
    );
  } else {
    const beforeChildIndex = children.indexOf(beforeChild);
    children.splice(beforeChildIndex, 0, child);

    const childTag = typeof child === 'number' ? child : child._nativeTag;

    UIManager.manageChildren(
      (parentInstance: any)._nativeTag, // containerID
      [], // moveFromIndices
      [], // moveToIndices
      [childTag], // addChildReactTags
      [beforeChildIndex], // addAtIndices
      [], // removeAtIndices
    );
  }
}

export function insertInContainerBefore(
  parentInstance: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  // TODO (bvaughn): Remove this check when...
  // We create a wrapper object for the container in ReactNative render()
  // Or we refactor to remove wrapper objects entirely.
  // For more info on pros/cons see PR #8560 description.
  if (typeof parentInstance === 'number') {
    throw new Error('Container does not support insertBefore operation');
  }
}

export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  recursivelyUncacheFiberNode(child);
  const children = parentInstance._children;
  const index = children.indexOf(child);

  children.splice(index, 1);

  UIManager.manageChildren(
    parentInstance._nativeTag, // containerID
    [], // moveFromIndices
    [], // moveToIndices
    [], // addChildReactTags
    [], // addAtIndices
    [index], // removeAtIndices
  );
}

export function removeChildFromContainer(
  parentInstance: Container,
  child: Instance | TextInstance,
): void {
  recursivelyUncacheFiberNode(child);
  UIManager.manageChildren(
    parentInstance, // containerID
    [], // moveFromIndices
    [], // moveToIndices
    [], // addChildReactTags
    [], // addAtIndices
    [0], // removeAtIndices
  );
}

export function resetTextContent(instance: Instance): void {
  // Noop
}

export function hideInstance(instance: Instance): void {
  const viewConfig = instance.viewConfig;
  const updatePayload = create(
    {style: {display: 'none'}},
    viewConfig.validAttributes,
  );
  UIManager.updateView(
    instance._nativeTag,
    viewConfig.uiViewClassName,
    updatePayload,
  );
}

export function hideTextInstance(textInstance: TextInstance): void {
  throw new Error('Not yet implemented.');
}

export function unhideInstance(instance: Instance, props: Props): void {
  const viewConfig = instance.viewConfig;
  const updatePayload = diff(
    {...props, style: [props.style, {display: 'none'}]},
    props,
    viewConfig.validAttributes,
  );
  UIManager.updateView(
    instance._nativeTag,
    viewConfig.uiViewClassName,
    updatePayload,
  );
}

export function clearContainer(container: Container): void {
  // TODO Implement this for React Native
  // UIManager does not expose a "remove all" type method.
}

export function unhideTextInstance(
  textInstance: TextInstance,
  text: string,
): void {
  throw new Error('Not yet implemented.');
}

export {getClosestInstanceFromNode as getInstanceFromNode};

export function beforeActiveInstanceBlur(internalInstanceHandle: Object) {
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

export function preloadInstance(type: Type, props: Props): boolean {
  // Return false to indicate it's already loaded
  return true;
}

export function startSuspendingCommit(): void {}

export function suspendInstance(type: Type, props: Props): void {}

export function waitForCommitToBeReady(): null {
  return null;
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
