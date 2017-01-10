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

type ReactTestRendererJSON = {
  type: string,
  props: { [propName: string]: string },
  children: null | Array<string | number | ReactTestRendererJSON>,
  $$typeof?: any
}

class TestContainer {
  createNodeMock: Function;

  constructor(createNodeMock) {
    this.createNodeMock = createNodeMock;
  }
  appendChild(child) {}
  insertBefore(beforeChild, child) {}
  removeChild(child) {}
  toJSON() {}
}

class TestComponent {
  props: Object;
  type: string;
  rootContainerInstance: TestContainer;
  children: Array<Instance | TextInstance>;
  $$typeof: Symbol;

  constructor(type, props, rootContainerInstance) {
    this.type = type;
    this.props = props;
    this.children = [];
    this.rootContainerInstance = rootContainerInstance;

    Object.defineProperty(this, '$$typeof', {
      value: Symbol.for('react.test.json'),
    });
  }

  appendChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    this.children.push(child);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    this.children.splice(index, 1);
  }

  insertBefore(beforeChild, child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    const beforeIndex = this.children.indexOf(beforeChild);
    if (beforeIndex === -1) {
      throw new Error('This child does not exist.');
    }
    this.children.splice(beforeIndex, 0, child);
  }

  update(type, props) {
    this.type = type;
    this.props = props;
  }

  toJSON() {
    const {children, ...props} = this.props;
    const json: ReactTestRendererJSON = {
      type: this.type,
      props: props,
      children: null,
    };

    Object.defineProperty(json, '$$typeof', {value: Symbol.for('react.test.json')});
    if (typeof children === 'string') {
      json.children = [children];
    } else {
      json.children = this.children.length
        ? this.children.map(child => child.toJSON())
        : null;
    }
    return json;
  }
}

type Container = TestContainer;
type Props = Object;
type Instance = TestComponent;
type TextInstance = {
  text: string | number,
  rootContainerInstance: Container,
  toJSON(): string | number,
};

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
    return new TestComponent(type, props, rootContainerInstance);
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
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
    instance.update(type, newProps);
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
    var inst = {
      text : text,
      rootContainerInstance,
      toJSON: () => isNaN(+inst.text) ? inst.text : +inst.text,
    };
    return inst;
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.text = newText;
  },

  appendChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    parentInstance.appendChild(child);
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    parentInstance.insertBefore(beforeChild, child);
  },

  removeChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    parentInstance.removeChild(child);
  },

  scheduleAnimationCallback(fn : Function) : void {
    setTimeout(fn);
  },

  scheduleDeferredCallback(fn: Function) : void {
    setTimeout(fn, 0, {timeRemaining: Infinity});
  },

  useSyncScheduling: true,

  getPublicInstance(ref) {
    const createNodeMock = ref.rootContainerInstance.createNodeMock;
    return createNodeMock(ref);
  },

});

var defaultTestOptions = {
  createNodeMock: function() {
    return null;
  },
};

var ReactTestFiberRenderer = {
  create(element: ReactElement<any>, options: TestRendererOptions) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var container = new TestContainer(createNodeMock);
    var root = TestRenderer.createContainer(container);
    TestRenderer.updateContainer(element, root, null, null);

    return {
      toJSON() {
        if (root == null) {
          return null;
        }
        const hostInstance = TestRenderer.findHostInstance(root);
        if (hostInstance === null) {
          return hostInstance;
        }
        return hostInstance.toJSON();
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
