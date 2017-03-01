/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFiber
 * @flow
 */

'use strict';

import type { Element } from 'React';
import type { Fiber } from 'ReactFiber';
import type { ReactNodeList } from 'ReactTypes';
import type { ReactNativeBaseComponentViewConfig } from 'ReactNativeViewConfigRegistry';

const NativeMethodsMixin = require('NativeMethodsMixin');
const ReactFiberReconciler = require('ReactFiberReconciler');
const ReactGenericBatching = require('ReactGenericBatching');
const ReactNativeAttributePayload = require('ReactNativeAttributePayload');
const ReactNativeComponentTree = require('ReactNativeComponentTree');
const ReactNativeInjection = require('ReactNativeInjection');
const ReactNativeTagHandles = require('ReactNativeTagHandles');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');
const ReactPortal = require('ReactPortal');
const UIManager = require('UIManager');

const deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
const emptyObject = require('fbjs/lib/emptyObject');
const findNodeHandle = require('findNodeHandle');
const invariant = require('fbjs/lib/invariant');

const { injectInternals } = require('ReactFiberDevToolsHook');
const {
  precacheFiberNode,
  uncacheFiberNode,
  updateFiberProps,
} = ReactNativeComponentTree;

ReactNativeInjection.inject();

type Container = number;
type Instance = {
  _children: Array<Instance | number>,
  _nativeTag: number,
  viewConfig: ReactNativeBaseComponentViewConfig,
};
type Props = Object;
type TextInstance = number;

function NativeHostComponent(tag, viewConfig) {
  this._nativeTag = tag;
  this._children = [];
  this.viewConfig = viewConfig;
}
Object.assign(NativeHostComponent.prototype, NativeMethodsMixin);

function recursivelyUncacheFiberNode(node : Instance | TextInstance) {
  if (typeof node === 'number') { // Leaf node (eg text)
    uncacheFiberNode(node);
  } else {
    uncacheFiberNode((node : any)._nativeTag);

    (node : any)._children.forEach(recursivelyUncacheFiberNode);
  }
}

const NativeRenderer = ReactFiberReconciler({
  appendChild(
    parentInstance : Instance | Container,
    child : Instance | TextInstance
  ) : void {
    if (typeof parentInstance === 'number') {
      // Root container
      UIManager.setChildren(
        parentInstance, // containerTag
        [(child : any)._nativeTag] // reactTags
      );
    } else {
      const children = parentInstance._children;

      children.push(child);

      UIManager.manageChildren(
        parentInstance._nativeTag, // containerTag
        [], // moveFromIndices
        [], // moveToIndices
        [(child : any)._nativeTag], // addChildReactTags
        [children.length - 1], // addAtIndices
        [], // removeAtIndices
      );
    }
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance._children.push(child);
  },

  commitTextUpdate(
    textInstance : TextInstance,
    oldText : string,
    newText : string
  ) : void {
    UIManager.updateView(
      textInstance, // reactTag
      'RCTRawText', // viewName
      {text: newText}, // props
    );
  },

  commitMount(
    instance : Instance,
    type : string,
    newProps : Props,
    internalInstanceHandle : Object
  ) : void {
    // Noop
  },

  commitUpdate(
    instance : Instance,
    updatePayloadTODO : Object,
    type : string,
    oldProps : Props,
    newProps : Props,
    internalInstanceHandle : Object
  ) : void {
    const viewConfig = instance.viewConfig;

    updateFiberProps(instance._nativeTag, newProps);

    const updatePayload = ReactNativeAttributePayload.diff(
      oldProps,
      newProps,
      viewConfig.validAttributes
    );

    UIManager.updateView(
      (instance : any)._nativeTag, // reactTag
      viewConfig.uiViewClassName, // viewName
      updatePayload, // props
    );
  },

  createInstance(
    type : string,
    props : Props,
    rootContainerInstance : Container,
    hostContext : {||},
    internalInstanceHandle : Object
  ) : Instance {
    const tag = ReactNativeTagHandles.allocateTag();
    const viewConfig = ReactNativeViewConfigRegistry.get(type);

    if (__DEV__) {
      for (let key in viewConfig.validAttributes) {
        if (props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(props[key]);
        }
      }
    }

    const updatePayload = ReactNativeAttributePayload.create(
      props,
      viewConfig.validAttributes
    );

    UIManager.createView(
      tag, // reactTag
      viewConfig.uiViewClassName, // viewName
      rootContainerInstance, // rootTag
      updatePayload, // props
    );

    const component = new NativeHostComponent(tag, viewConfig);

    precacheFiberNode(internalInstanceHandle, tag);
    updateFiberProps(tag, props);

    return component;
  },

  createTextInstance(
    text : string,
    rootContainerInstance : Container,
    hostContext : {||},
    internalInstanceHandle : Object,
  ) : TextInstance {
    const tag = ReactNativeTagHandles.allocateTag();

    UIManager.createView(
      tag, // reactTag
      'RCTRawText', // viewName
      rootContainerInstance, // rootTag
      {text: text} // props
    );

    precacheFiberNode(internalInstanceHandle, tag);

    return tag;
  },

  finalizeInitialChildren(
    parentInstance : Instance,
    type : string,
    props : Props,
    rootContainerInstance : Container,
  ) : boolean {
    // Don't send a no-op message over the bridge.
    if (parentInstance._children.length === 0) {
      return false;
    }

    // Map from child objects to native tags.
    // Either way we need to pass a copy of the Array to prevent it from being frozen.
    const nativeTags = parentInstance._children.map(
      (child) => typeof child === 'number'
        ? child // Leaf node (eg text)
        : child._nativeTag
    );

    UIManager.setChildren(
      parentInstance._nativeTag, // containerTag
      nativeTags // reactTags
    );

    return false;
  },

  getRootHostContext() : {||} {
    return emptyObject;
  },

  getChildHostContext() : {||} {
    return emptyObject;
  },

  getPublicInstance(instance) {
    return instance;
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    // TODO (bvaughn): Remove this check when...
    // We create a wrapper object for the container in ReactNative render()
    // Or we refactor to remove wrapper objects entirely.
    // For more info on pros/cons see PR #8560 description.
    invariant(
      typeof parentInstance !== 'number',
      'Container does not support insertBefore operation',
    );

    const children = (parentInstance : any)._children;

    const beforeChildIndex = children.indexOf(beforeChild);
    const index = children.indexOf(child);

    // Move existing child or add new child?
    if (index >= 0) {
      children.splice(index, 1);
      children.splice(beforeChildIndex, 0, child);

      UIManager.manageChildren(
        (parentInstance : any)._nativeTag, // containerID
        [index], // moveFromIndices
        [beforeChildIndex], // moveToIndices
        [], // addChildReactTags
        [], // addAtIndices
        [], // removeAtIndices
      );
    } else {
      children.splice(beforeChildIndex, 0, child);

      UIManager.manageChildren(
        (parentInstance : any)._nativeTag, // containerID
        [], // moveFromIndices
        [], // moveToIndices
        [(child : any)._nativeTag], // addChildReactTags
        [beforeChildIndex], // addAtIndices
        [], // removeAtIndices
      );
    }
  },

  prepareForCommit() : void {
    // Noop
  },

  prepareUpdate(
    instance : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    rootContainerInstance : Container,
    hostContext : {||}
  ) : null | Object {
    return emptyObject;
  },

  removeChild(
    parentInstance : Instance | Container,
    child : Instance | TextInstance
  ) : void {
    recursivelyUncacheFiberNode(child);

    if (typeof parentInstance === 'number') {
      UIManager.manageChildren(
        parentInstance, // containerID
        [], // moveFromIndices
        [], // moveToIndices
        [], // addChildReactTags
        [], // addAtIndices
        [0], // removeAtIndices
      );
    } else {
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
  },

  resetAfterCommit() : void {
    // Noop
  },

  resetTextContent(instance : Instance) : void {
    // Noop
  },

  scheduleAnimationCallback: global.requestAnimationFrame,

  scheduleDeferredCallback: global.requestIdleCallback,

  shouldSetTextContent(props : Props) : boolean {
    // TODO (bvaughn) Revisit this decision.
    // Always returning false simplifies the createInstance() implementation,
    // But creates an additional child Fiber for raw text children.
    // No additional native views are created though.
    // It's not clear to me which is better so I'm deferring for now.
    // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
    return false;
  },

  useSyncScheduling: true,
});

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  NativeRenderer.batchedUpdates
);

const roots = new Map();

findNodeHandle.injection.injectFindNode(
  (fiber: Fiber) => {
    const instance: any = NativeRenderer.findHostInstance(fiber);
    return instance ? instance._nativeTag : null;
  }
);
findNodeHandle.injection.injectFindRootNodeID(
  (instance) => instance._nativeTag
);

const ReactNative = {
  findNodeHandle,

  render(element : Element<any>, containerTag : any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = NativeRenderer.createContainer(containerTag);
      roots.set(containerTag, root);
    }
    NativeRenderer.updateContainer(element, root, null, callback);

    return NativeRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag : number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      NativeRenderer.updateContainer(null, root, null, () => {
        roots.delete(containerTag);
      });
    }
  },

  unmountComponentAtNodeAndRemoveContainer(containerTag: number) {
    ReactNative.unmountComponentAtNode(containerTag);

    // Call back into native to remove all of the subviews from this container
    UIManager.removeRootView(containerTag);
  },

  unstable_createPortal(children: ReactNodeList, containerTag : number, key : ?string = null) {
    return ReactPortal.createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

};

if (typeof injectInternals === 'function') {
  injectInternals({
    findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
    findHostInstanceByFiber: NativeRenderer.findHostInstance,
  });
}

module.exports = ReactNative;
