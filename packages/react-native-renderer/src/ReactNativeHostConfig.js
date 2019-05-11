/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNativeBaseComponentViewConfig} from './ReactNativeTypes';
import type {ReactEventComponentInstance} from 'shared/ReactTypes';

import invariant from 'shared/invariant';

// Modules provided by RN:
import UIManager from 'UIManager';
import deepFreezeAndThrowOnMutationInDev from 'deepFreezeAndThrowOnMutationInDev';

import {get as getViewConfigForType} from 'ReactNativeViewConfigRegistry';
import {create, diff} from './ReactNativeAttributePayload';
import {
  precacheFiberNode,
  uncacheFiberNode,
  updateFiberProps,
} from './ReactNativeComponentTree';
import ReactNativeFiberHostComponent from './ReactNativeFiberHostComponent';

export type Type = string;
export type Props = Object;
export type Container = number;
export type Instance = {
  _children: Array<Instance | number>,
  _nativeTag: number,
  viewConfig: ReactNativeBaseComponentViewConfig<>,
};
export type TextInstance = number;
export type HydratableInstance = Instance | TextInstance;
export type PublicInstance = Instance;
export type HostContext = $ReadOnly<{|
  isInAParentText: boolean,
|}>;
export type UpdatePayload = Object; // Unused
export type ChildSet = void; // Unused

export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;

const UPDATE_SIGNAL = {};
if (__DEV__) {
  Object.freeze(UPDATE_SIGNAL);
}

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

export * from 'shared/HostConfigWithNoPersistence';
export * from 'shared/HostConfigWithNoHydration';

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

  const component = new ReactNativeFiberHostComponent(tag, viewConfig);

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
  invariant(
    hostContext.isInAParentText,
    'Text strings must be rendered within a <Text> component.',
  );

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
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  // Don't send a no-op message over the bridge.
  if (parentInstance._children.length === 0) {
    return false;
  }

  // Map from child objects to native tags.
  // Either way we need to pass a copy of the Array to prevent it from being frozen.
  const nativeTags = parentInstance._children.map(
    child =>
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
  rootContainerInstance: Container,
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

export function getChildHostContextForEventComponent(
  parentHostContext: HostContext,
) {
  // TODO: add getChildHostContextForEventComponent implementation
  return parentHostContext;
}

export function getChildHostContextForEventTarget(
  parentHostContext: HostContext,
  type: Symbol | number,
) {
  // TODO: add getChildHostContextForEventTarget implementation
  return parentHostContext;
}

export function getPublicInstance(instance: Instance): * {
  return instance;
}

export function prepareForCommit(containerInfo: Container): void {
  // Noop
}

export function prepareUpdate(
  instance: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): null | Object {
  return UPDATE_SIGNAL;
}

export function resetAfterCommit(containerInfo: Container): void {
  // Noop
}

export const isPrimaryRenderer = true;

export const scheduleTimeout = setTimeout;
export const cancelTimeout = clearTimeout;
export const noTimeout = -1;

export function shouldDeprioritizeSubtree(type: string, props: Props): boolean {
  return false;
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
  updatePayloadTODO: Object,
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
  invariant(
    typeof parentInstance !== 'number',
    'Container does not support insertBefore operation',
  );
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

export function unhideTextInstance(
  textInstance: TextInstance,
  text: string,
): void {
  throw new Error('Not yet implemented.');
}

export function mountEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
) {
  throw new Error('Not yet implemented.');
}

export function updateEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
) {
  throw new Error('Not yet implemented.');
}

export function unmountEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
): void {
  throw new Error('Not yet implemented.');
}

export function getEventTargetChildElement(
  type: Symbol | number,
  props: Props,
): null {
  throw new Error('Not yet implemented.');
}

export function handleEventTarget(
  type: Symbol | number,
  props: Props,
  rootContainerInstance: Container,
  internalInstanceHandle: Object,
): boolean {
  throw new Error('Not yet implemented.');
}

export function commitEventTarget(
  type: Symbol | number,
  props: Props,
  instance: Instance,
  parentInstance: Instance,
): void {
  throw new Error('Not yet implemented.');
}
