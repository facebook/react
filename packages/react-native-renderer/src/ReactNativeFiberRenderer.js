/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNativeBaseComponentViewConfig} from './ReactNativeTypes';

import ReactFiberReconciler from 'react-reconciler';
import emptyObject from 'fbjs/lib/emptyObject';
import invariant from 'fbjs/lib/invariant';
// Modules provided by RN:
import UIManager from 'UIManager';
import deepFreezeAndThrowOnMutationInDev from 'deepFreezeAndThrowOnMutationInDev';

import * as ReactNativeViewConfigRegistry from 'ReactNativeViewConfigRegistry';
import * as ReactNativeAttributePayload from './ReactNativeAttributePayload';
import {
  precacheFiberNode,
  uncacheFiberNode,
  updateFiberProps,
} from './ReactNativeComponentTree';
import ReactNativeFiberHostComponent from './ReactNativeFiberHostComponent';
import * as ReactNativeFrameScheduling from './ReactNativeFrameScheduling';

type Container = number;
export type Instance = {
  _children: Array<Instance | number>,
  _nativeTag: number,
  viewConfig: ReactNativeBaseComponentViewConfig,
};
type Props = Object;
type TextInstance = number;

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

const NativeRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance._children.push(child);
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): Instance {
    const tag = allocateTag();
    const viewConfig = ReactNativeViewConfigRegistry.get(type);

    if (__DEV__) {
      for (const key in viewConfig.validAttributes) {
        if (props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(props[key]);
        }
      }
    }

    const updatePayload = ReactNativeAttributePayload.create(
      props,
      viewConfig.validAttributes,
    );

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
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): TextInstance {
    const tag = allocateTag();

    UIManager.createView(
      tag, // reactTag
      'RCTRawText', // viewName
      rootContainerInstance, // rootTag
      {text: text}, // props
    );

    precacheFiberNode(internalInstanceHandle, tag);

    return tag;
  },

  finalizeInitialChildren(
    parentInstance: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
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
  },

  getRootHostContext(): {} {
    return emptyObject;
  },

  getChildHostContext(): {} {
    return emptyObject;
  },

  getPublicInstance(instance) {
    return instance;
  },

  now: ReactNativeFrameScheduling.now,

  prepareForCommit(): void {
    // Noop
  },

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: {},
  ): null | Object {
    return emptyObject;
  },

  resetAfterCommit(): void {
    // Noop
  },

  scheduleDeferredCallback: ReactNativeFrameScheduling.scheduleDeferredCallback,
  cancelDeferredCallback: ReactNativeFrameScheduling.cancelDeferredCallback,

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    // TODO (bvaughn) Revisit this decision.
    // Always returning false simplifies the createInstance() implementation,
    // But creates an additional child Fiber for raw text children.
    // No additional native views are created though.
    // It's not clear to me which is better so I'm deferring for now.
    // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
    return false;
  },

  mutation: {
    appendChild(
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
    },

    appendChildToContainer(
      parentInstance: Container,
      child: Instance | TextInstance,
    ): void {
      const childTag = typeof child === 'number' ? child : child._nativeTag;
      UIManager.setChildren(
        parentInstance, // containerTag
        [childTag], // reactTags
      );
    },

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      UIManager.updateView(
        textInstance, // reactTag
        'RCTRawText', // viewName
        {text: newText}, // props
      );
    },

    commitMount(
      instance: Instance,
      type: string,
      newProps: Props,
      internalInstanceHandle: Object,
    ): void {
      // Noop
    },

    commitUpdate(
      instance: Instance,
      updatePayloadTODO: Object,
      type: string,
      oldProps: Props,
      newProps: Props,
      internalInstanceHandle: Object,
    ): void {
      const viewConfig = instance.viewConfig;

      updateFiberProps(instance._nativeTag, newProps);

      const updatePayload = ReactNativeAttributePayload.diff(
        oldProps,
        newProps,
        viewConfig.validAttributes,
      );

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
    },

    insertBefore(
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
    },

    insertInContainerBefore(
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
    },

    removeChild(
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
    },

    removeChildFromContainer(
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
    },

    resetTextContent(instance: Instance): void {
      // Noop
    },
  },
});

export default NativeRenderer;
