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
const ReactElementSymbol = require('ReactElementSymbol');
const invariant = require('invariant');

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
    invariant(
      React.isValidElement(element),
      'ReactShallowRenderer render(): Invalid component element.%s',
      typeof element === 'function' ?
        ' Instead of passing a component class, make sure to instantiate ' +
        'it by passing it to React.createElement.' :
        ''
    );
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
      'components, not primitives (%s). Instead of calling `.render(el)` and ' +
      'inspecting the rendered output, look at `el.props` directly instead.',
      element.type
    );
    
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
