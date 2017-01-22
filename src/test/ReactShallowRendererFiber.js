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

const emptyObject = require('emptyObject');
const ReactFiberReconciler = require('ReactFiberReconciler');
const ReactElementSymbol = require('ReactElementSymbol');

type Props = {
  children : Array<any>,
};

type Container = {
  element : Instance | TextInstance | {},
  context : Object,
};

type Instance = {|
  type : string,
  $$typeof : number,
  props : Object,
  ref : null,
  key : null,
  _store : Object,
  _owner : null,
|};

type TextInstance = {|
  text : string,
|};

const reconciler = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance : Container) {
    return rootContainerInstance.context || emptyObject;
  },

  getChildHostContext(parentHostContext, type) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  createInstance(type : string, props : Props, hostContext, internalInstanceHandle) : Instance {
    const { children, ...instanceProps } = props;

    if (children) {
      instanceProps.children = [];
    }

    return {
      type,
      $$typeof: ReactElementSymbol,
      props: instanceProps,
      key: null,
      _owner: null,
      _store: {},
      ref: null,
    };
  },

  appendInitialChild(parentInstance, child) {
    parentInstance.props.children.push(child);
  },
  finalizeInitialChildren(parentInstance, type, props, rootContainerInstance) : boolean {
    return false;
  },

  prepareUpdate(instance, type, oldProps, newProps, hostContext) : boolean {
    return true;
  },
  commitUpdate(instance, type, oldProps, newProps, rootContainerInstance, internalInstanceHandle) {},
  commitMount(instance, type, newProps, rootContainerInstance, internalInstanceHandle) {},

  shouldSetTextContent(props : Props) : boolean {
    return (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    );
  },
  resetTextContent(instance) {},

  createTextInstance(text : string) : TextInstance {
    return { text };
  },
  commitTextUpdate(textInstance, oldText, newText) {},

  appendChild(parentInstance : Container | Instance, child : Instance | TextInstance) {
    if (parentInstance.element) {
      parentInstance.element = child;
    }
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
  container_ = (null: ?Container);

  render(element : React$Element<*>, context = emptyObject) {
    this.container_ = {
      context,
      element: emptyObject,
    };

    const root = reconciler.createContainer(this.container_);
    reconciler.updateContainer(element, root, null, null);
    return this.getRenderOutput();
  }

  getRenderOutput() {
    const component = this.container_ && this.container_.element;
    return component === emptyObject ? null : component;
  }
}

module.exports = ReactShallowRendererFiber;
