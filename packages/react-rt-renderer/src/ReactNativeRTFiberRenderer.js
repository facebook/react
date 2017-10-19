/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeRTFiberRenderer
 * @flow
 */

'use strict';

const ReactFiberReconciler = require('react-reconciler');
const ReactNativeRTComponentTree = require('ReactNativeRTComponentTree');
const ReactNativeRTTagHandles = require('ReactNativeRTTagHandles');
const RTManager = require('RTManager');

const emptyObject = require('fbjs/lib/emptyObject');
const invariant = require('fbjs/lib/invariant');

export type Container = number;
export type Instance = number;
export type Props = Object;
export type TextInstance = number;

const {precacheFiberNode, updateFiberProps} = ReactNativeRTComponentTree;

function processProps(instance: number, props: Props): Object {
  const propsPayload = {};
  for (var key in props) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    var value = props[key];
    if (typeof value === 'function') {
      value = {
        style: 'rt-event',
        event: key,
        tag: instance,
      };
    }
    propsPayload[key] = value;
  }
  return propsPayload;
}

function arePropsEqual(oldProps: Props, newProps: Props): boolean {
  var key;
  for (key in newProps) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    if (newProps[key] !== oldProps[key]) {
      return false;
    }
  }
  for (key in oldProps) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    if (!(key in newProps)) {
      return false;
    }
  }
  return true;
}

const NativeRTRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    RTManager.appendChild(parentInstance, child);
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): Instance {
    const tag = ReactNativeRTTagHandles.allocateTag();
    precacheFiberNode(internalInstanceHandle, tag);
    updateFiberProps(tag, props);
    RTManager.createNode(tag, type, processProps(tag, props));
    return tag;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): TextInstance {
    invariant(false, 'Text components are not supported for now.');
  },

  finalizeInitialChildren(
    parentInstance: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
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

  prepareForCommit(): void {
    RTManager.beginUpdates();
  },

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: {},
  ): null | Object {
    if (arePropsEqual(oldProps, newProps)) {
      return null;
    }
    return processProps(instance, newProps);
  },

  resetAfterCommit(): void {
    RTManager.completeUpdates();
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  scheduleDeferredCallback: global.requestIdleCallback,

  shouldSetTextContent(type: string, props: Props): boolean {
    // TODO: Figure out when we should allow text content.
    return false;
  },

  useSyncScheduling: true,

  now(): number {
    // TODO: Enable expiration by implementing this method.
    return 0;
  },

  mutation: {
    appendChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      RTManager.appendChild(parentInstance, child);
    },

    appendChildToContainer(
      parentInstance: Container,
      child: Instance | TextInstance,
    ): void {
      RTManager.appendChildToContext(parentInstance, child);
    },

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      invariant(false, 'Text components are not yet supported.');
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
      updatePayload: Object,
      type: string,
      oldProps: Props,
      newProps: Props,
      internalInstanceHandle: Object,
    ): void {
      updateFiberProps(instance, newProps);
      RTManager.updateNode(instance, updatePayload);
    },

    insertBefore(
      parentInstance: Instance,
      child: Instance | TextInstance,
      beforeChild: Instance | TextInstance,
    ): void {
      RTManager.prependChild(child, beforeChild);
    },

    insertInContainerBefore(
      parentInstance: Container,
      child: Instance | TextInstance,
      beforeChild: Instance | TextInstance,
    ): void {
      RTManager.prependChild(child, beforeChild);
    },

    removeChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      // TODO: recursively uncache, by traversing fibers, this will currently leak
      RTManager.deleteChild(child);
    },

    removeChildFromContainer(
      parentInstance: Container,
      child: Instance | TextInstance,
    ): void {
      // TODO: recursively uncache, by traversing fibers, this will currently leak
      RTManager.deleteChild(child);
    },

    resetTextContent(instance: Instance): void {
      // Noop
    },
  },
});

module.exports = NativeRTRenderer;
