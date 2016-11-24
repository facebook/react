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

import type { Fiber } from 'ReactFiber';
import type { HostChildren } from 'ReactFiberReconciler';
import type {
  Instance,
  TextInstance,
  Container,
  Props,
} from 'ReactNativeFiberComponent';

var ReactNativeFeatureFlags = require('ReactNativeFeatureFlags');
var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactNativeInjection = require('ReactNativeInjection');
var ReactNativeAttributePayload = require('ReactNativeAttributePayload');
var UIManager = require('UIManager');
var findNodeHandle = require('findNodeHandle');
var ReactNativeFiberComponent = require('ReactNativeFiberComponent');

var warning = require('warning');

var { precacheFiberNode } = ReactNativeComponentTree;
var {
  createSingleChild,
  updateSingleChild,
  createInstance,
  createTextInstance,
  updateTextInstance,
  appendChild,
  moveChild,
  insertBefore,
  removeChild,
} = ReactNativeFiberComponent;

ReactNativeInjection.inject();

findNodeHandle._injectFiber(function(fiber: Fiber) {
  const inst = NativeRenderer.findHostInstance(fiber);
  return inst ? inst._rootNodeID : null;
});

function isText(maybeText: any) {
  return typeof maybeText === 'string' || typeof maybeText === 'number';
}

var NativeRenderer = ReactFiberReconciler({
  prepareForCommit() {

  },
  resetAfterCommit() {

  },
  createInstance(
    type : string,
    props : Props,
    internalInstanceHandle : Object
  ) : Instance {
    const { viewConfig } = internalInstanceHandle.return.type;
    const root = 1; // HACK
    const attributes = ReactNativeAttributePayload.create(
      props,
      viewConfig.validAttributes
    );

    const node = createInstance(type, attributes, root);
    precacheFiberNode(internalInstanceHandle, node._rootNodeID);

    if (isText(props.children)) {
      createSingleChild(node, '' + props.children, root);
    }

    return node;
  },

  prepareUpdate(
    node : Instance,
    oldProps : Props,
    newProps : Props
  ) : boolean {
    return true;
  },

  commitUpdate(
    node : Instance,
    oldProps : Props,
    newProps : Props,
    internalInstanceHandle: Object
  ) : void {
    var root = 1; // HACK
    const { viewConfig } = internalInstanceHandle.return.type;
    const oldChildren = oldProps.children;
    const newChildren = newProps.children;

    // Single child handling
    if (node.child) {
      // handles text updates and deletion of single child
      updateSingleChild(node, newChildren);
    } else if (isText(newChildren)) {
      // handles creation of single child
      createSingleChild(node, '' + newChildren, root);
      UIManager.setChildren(node._rootNodeID, node.children.slice());
    }

    const updatePayload = ReactNativeAttributePayload.diff(
      oldProps,
      newProps,
      viewConfig.validAttributes
    );

    if (updatePayload) {
      UIManager.updateView(
        node._rootNodeID,
        viewConfig.uiViewClassName,
        updatePayload
      );
    }
  },

  createTextInstance(
    text: string,
    internalInstanceHandle : Object
  ) : TextInstance {
    const root = 1; // HACK
    const node = createTextInstance(text, root);
    precacheFiberNode(internalInstanceHandle, node._rootNodeID);
    return node;
  },

  commitTextUpdate(
    textInstance : TextInstance,
    oldText : string,
    newText : string
  ) : void {
    if (oldText !== newText) {
      updateTextInstance(textInstance, newText);
    }
  },

  appendInitialChild(
    parent: Instance,
    child: Instance | TextInstance
  ): void {
    appendChild(parent, child);
  },

  finalizeInitialChildren(
    node: Instance,
    type: string,
    props: Props
  ): void {
    UIManager.setChildren(node._rootNodeID, node.children.slice());
  },

  appendChild(
    parent: Instance | Container,
    child : Instance | TextInstance
  ) : void {
    if (parent.children.includes(child._rootNodeID)) {
      const [fromIndex, toIndex] = moveChild(parent, child);
      UIManager.manageChildren(
        parent._rootNodeID,
        [fromIndex],
        [toIndex],
        [],
        [],
        []
      );
    } else {
      const newIndex = appendChild(parent, child);
      UIManager.manageChildren(
        parent._rootNodeID,
        [],
        [],
        [child._rootNodeID],
        [newIndex],
        []
      );
    }
  },

  insertBefore(
    parent : Instance | Container,
    child : Instance | TextInstance,
    before : Instance | TextInstance
  ) : void {;
    const [childIndex, beforeIndex] = insertBefore(parent, child, before);
    UIManager.manageChildren(
      parent._rootNodeID,
      [childIndex],
      [beforeIndex],
      [],
      [],
      []
    );
  },

  removeChild(
    parent : Instance | Container,
    child : Instance | TextInstance
  ) : void {
    const removedIndex = removeChild(parent, child);
    UIManager.manageChildren(
      parent._rootNodeID,
      [],
      [],
      [],
      [],
      [removedIndex]
    );
  },

  scheduleAnimationCallback: global.requestAnimationFrame,

  scheduleDeferredCallback: global.requestIdleCallback,

  useSyncScheduling: true,

});

var warned = false;

function warnAboutUnstableUse() {
  // Ignore this warning is the feature flag is turned on. E.g. for tests.
  warning(
    warned || ReactNativeFeatureFlags.useFiber,
    'You are using React DOM Fiber which is an experimental renderer. ' +
    'It is likely to have bugs, breaking changes and is unsupported.'
  );
  warned = true;
}

var _instancesByContainerID = {};

var ReactNative = {

  render(element : ReactElement<any>, containerTag : number, callback: ?Function) {
    warnAboutUnstableUse();
    if (!ReactNativeTagHandles.reactTagIsNativeTopRootID(containerTag)) {
      console.error('You cannot render into anything but a top root');
      return null;
    }

    ReactNativeTagHandles.assertRootTag(containerTag);

    let root;
    if (!_instancesByContainerID[containerTag]) {
      UIManager.removeSubviewsFromContainerWithID(containerTag);
      root = NativeRenderer.mountContainer(
        element,
        { _rootNodeID: containerTag, children: [] },
        callback
      );
    } else {
      NativeRenderer.updateContainer(
        element,
        root = _instancesByContainerID[containerTag],
        callback
      );
    }
    _instancesByContainerID[containerTag] = root;

    return NativeRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag : number) {
    warnAboutUnstableUse();
    const root = _instancesByContainerID[containerTag];
    _instancesByContainerID[containerTag] = null;
    if (root) {
      NativeRenderer.unmountContainer(root);
    }
  },

  findNodeHandle: findNodeHandle,

  unstable_batchedUpdates<A>(fn : () => A) : A {
    return NativeRenderer.batchedUpdates(fn);
  },

};

module.exports = ReactNative;
