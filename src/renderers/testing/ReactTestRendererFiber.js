/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestRendererFiber
 * @preventMunge
 * @flow
 */

'use strict';

var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactGenericBatching = require('ReactGenericBatching');
var emptyObject = require('emptyObject');

import type { TestRendererOptions } from 'ReactTestMount';

type ReactTestRendererJSON = {|
  type: string,
  props: { [propName: string]: string },
  children: null | Array<string | ReactTestRendererJSON>,
  $$typeof?: any
|};

type Container = {|
  children: Array<Instance | TextInstance>,
  createNodeMock: Function
|};

type Props = Object;
type Instance = {|
  type: string,
  props: Object,
  children: Array<Instance | TextInstance>,
  rootContainerInstance: Container,
  $$typeof?: any
|};
type TextInstance = {|text: string|};

var TestRenderer = ReactFiberReconciler({
  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  prepareForCommit() : void {
    // noop
  },

  resetAfterCommit() : void {
    // noop
  },

  createInstance(
    type : string,
    props : Props,
    rootContainerInstance : Container,
    hostContext : Object,
    internalInstanceHandle : Object,
  ) : Instance {
    const inst : Instance = {
      type,
      props,
      children: [],
      rootContainerInstance,
    };

    Object.defineProperty(inst, '$$typeof', {
      value: Symbol.for('react.test.json'),
    });

    return inst;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },

  finalizeInitialChildren(
    testElement : Instance,
    type : string,
    props : Props,
    rootContainerInstance : Container,
  ) : boolean {
    return false;
  },

  prepareUpdate(
    testElement : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    hostContext : Object,
  ) : boolean {
    return true;
  },

  commitUpdate(
    instance : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    rootContainerInstance : Container,
    internalInstanceHandle : Object,
  ) : void {
    instance.type = type;
    instance.props = newProps;
  },

  commitMount(
    instance : Instance,
    type : string,
    newProps : Props,
    rootContainerInstance : Object,
    internalInstanceHandle : Object
  ) : void {
    // Noop
  },

  shouldSetTextContent(props : Props) : boolean {
    return false;
  },

  resetTextContent(testElement : Instance) : void {
    // Noop
  },

  createTextInstance(
    text : string,
    rootContainerInstance : Container,
    hostContext : Object,
    internalInstanceHandle : Object
  ) : TextInstance {
    return {text};
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.text = newText;
  },

  appendChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    const index = parentInstance.children.indexOf(child);

    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    const beforeIndex = parentInstance.children.indexOf(beforeChild);
    if (beforeIndex === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(beforeIndex, 0, child);
  },

  removeChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    const index = parentInstance.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(index, 1);
  },

  scheduleAnimationCallback(fn : Function) : void {
    setTimeout(fn);
  },

  scheduleDeferredCallback(fn: Function) : void {
    setTimeout(fn, 0, {timeRemaining: Infinity});
  },

  useSyncScheduling: true,

  getPublicInstance(ref) {
    if (typeof ref.text === 'string') {
      return ref.text;
    } else if (
      typeof ref.rootContainerInstance === 'object' &&
      typeof ref.rootContainerInstance.createNodeMock === 'function'
    ) {
      const createNodeMock = ref.rootContainerInstance.createNodeMock;
      return createNodeMock(ref);
    }

    // this should not be possible
    throw new Error('Attempted to getPublicInstance on an invalid ref.');
  },

});

var defaultTestOptions = {
  createNodeMock: function() {
    return null;
  },
};

const toJSON = (child : Instance | TextInstance) => {
  if (typeof child.text === 'string') {
    return child.text;
  }

  const childInst : Instance = (child : any);
  /* eslint-disable no-unused-vars */
  /* ignoring the children prop and managing that ourselves*/
  const {children, ...props} = childInst.props;
  /* eslint-enable */
  const json : ReactTestRendererJSON = {
    type: childInst.type,
    props: props,
    children: null,
  };
  Object.defineProperty(json, '$$typeof', {value: Symbol.for('react.test.json')});
  if (childInst.children !== null) {
    json.children = childInst.children.length
      ? childInst.children.map(toJSON)
      : null;
  }
  return json;
};

var ReactTestFiberRenderer = {
  create(element: ReactElement<any>, options: TestRendererOptions) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var container = {children: [], createNodeMock};
    var root = TestRenderer.createContainer(container);
    TestRenderer.updateContainer(element, root, null, null);

    return {
      toJSON() {
        if (root == null || container == null) {
          return null;
        }
        if (container.children.length === 0) {
          return null;
        }
        if (container.children.length === 1) {
          return toJSON(container.children[0]);
        }
        return container.children.map(toJSON);
      },

      update(newElement: ReactElement<any>) {
        if (root == null) {
          return;
        }
        TestRenderer.updateContainer(newElement, root, null, null);
      },
      unmount() {
        if (root == null) {
          return;
        }
        TestRenderer.updateContainer(null, root, null);
        container = null;
        root = null;
      },
      getInstance() {
        if (root == null) {
          return null;
        }
        return TestRenderer.getPublicRootInstance(root);
      },
    };
  },

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,
  /* eslint-enable camelcase */
};

module.exports = ReactTestFiberRenderer;
