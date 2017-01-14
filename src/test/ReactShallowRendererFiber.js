/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactShallowRendererFiber
 * @flow
 */

'use strict';

const React = require('React');
const emptyObject = require('emptyObject');
const ReactFiberReconciler = require('ReactFiberReconciler');

type Props = {
  children : Array<any>,
};

type Container = {|
  children : Array<Instance | TextInstance | null>,
  context : Object,
|};

type Instance = {|
  type : string,
  props : Props,
  children : Array<Instance | TextInstance | null>,
  rootContainerInstance : Container,
|};

type TextInstance = {|
  text : string,
|};

function removeOwner(element : React$Element) {
  return {
    ...element,
    _owner: null,
  }
}

const reconciler = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance : Container) {
    return rootContainerInstance.context || emptyObject
  },

  getChildHostContext(parentHostContext, type) {
    return parentHostContext;
  },

  createInstance(type : string, props : Props) : Instance {
    return {
      type,
      props,
      children: [],
    };
  },

  appendInitialChild(parentInstance, child) {},
  finalizeInitialChildren(parentInstance, type, props, rootContainerInstance) {},

  prepareUpdate(instance, type, oldProps, newProps, hostContext) {},
  commitUpdate(instance, type, oldProps, newProps, rootContainerInstance, internalInstanceHandle) {},
  commitMount(instance, type, newProps, rootContainerInstance, internalInstanceHandle) {},

  shouldSetTextContent(props) {},
  resetTextContent(instance) {},

  createTextInstance(text : string) : TextInstance {
    return { text }
  },
  commitTextUpdate(textInstance, oldText, newText) {},

  appendChild(parentInstance : Container | Instance, child : Instance) {
    parentInstance.children.push({
      $$typeof: child.$$typeof,
      type: child.type,
      key: child.key,
      _owner: null,
      _store: {},
      ref: child.ref,
      props: {
        children: [...child.props.children].map(removeOwner),
      },
    });
  },
  insertBefore(parentInstance, child, beforeChild) {},
  removeChild(parentInstance, child) {},

  prepareForCommit() {},
  resetAfterCommit(commitInfo) {},

  scheduleAnimationCallback: window.requestAnimaionFrame,
  scheduleDeferredCallback: window.requestIdleCallback,
  useSyncScheduling: true,
});

class ReactShallowRendererFiber {
  container = (null: ?Container);

  render(element, context = emptyObject) {
    this.container = {
      context,
      children: [],
    };

    const root = reconciler.createContainer(this.container);

    reconciler.updateContainer(element, root, null, null);

    return this.getRenderOutput();
  }

  getRenderOutput() {
    const hasChildren = this.container.children.length > 0;
    return hasChildren ? this.container.children[0] : null;
  }
}

module.exports = ReactShallowRendererFiber;
