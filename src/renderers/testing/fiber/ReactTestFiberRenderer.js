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

var invariant = require('invariant');
var ReactFiberReconciler = require('ReactFiberReconciler');

import type { ReactElement } from 'ReactElementType';
import type { ReactInstance } from 'ReactInstanceType';

type ReactTestRendererJSON = {
  type: string,
  props: { [propName: string]: string },
  children: null | Array<string | ReactTestRendererJSON>,
  $$typeof?: any
}

let instanceCounter = 0;

class TestContainer {
  constructor(rootID, createNodeMock) {
    this.rootID = rootID;
    this.createNodeMock = createNodeMock;
  }
  appendChild(child) {}
  insertBefore(beforeChild, child) {}
  removeChild(child) {}
  toJSON() {}
}

class TestComponent {
  constructor(type, props, rootContainerInstance) {
    this.id = instanceCounter++;
    this.type = type;
    this.props = props;
    this.children = [];
    this.rootContainerInstance = rootContainerInstance;

    Object.defineProperty(this, 'id', { value: this.id, enumerable: false });
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
    // console.log('update', type, props, this.children);
    // need to manually update text nodes
    this.type = type;
    this.props = props;
  }

  toJSON() {
    // eslint-disable ignore the children
    const {children, ...props} = this.props;
    // eslint-enable
    const json = {
      type: this.type,
      props: props,
      children: null,
    };

    Object.defineProperty(json, '$$typeof', {value: Symbol.for('react.test.json')});
    if (typeof children === 'string') {
      json.children = [children];
    } else {
      var childrenJSON = [];
      this.children.forEach((child) => {
        if (typeof child.toJSON === 'function') {
          childrenJSON.push(child.toJSON());
        } else if (typeof child.text !== 'undefined') {
          childrenJSON.push(isNaN(+child.text) ? child.text : +child.text);
        }
      });
      json.children = childrenJSON.length ? childrenJSON : null;
    }
    return json;
  }
}

type Instance = TestComponent;

var TestRenderer = ReactFiberReconciler({
  getRootHostContext(rootContainerInstance : Container) : HostContext {
    return {};
  },

  getChildHostContext(
    parentHostContext : HostContext,
    type : string,
  ) : HostContext {
    return {};
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
    hostContext : HostContext,
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
  ) : void {
    // console.log('finalizeInitialChildren');
    // setInitialProperties(testElement, type, props, rootContainerInstance);
  },

  prepareUpdate(
    testElement : Instance,
    type : string,
    oldProps : Props,
    newProps : Props,
    hostContext : HostContext,
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

  shouldSetTextContent(props : Props) : boolean {
    return (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    );
  },

  resetTextContent(testElement : Instance) : void {},

  createTextInstance(
    text : string,
    rootContainerInstance : Container,
    hostContext : HostContext,
    internalInstanceHandle : Object
  ) : TextInstance {
    var inst = { text : text, id: instanceCounter++ };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
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

  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback,

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
  create(element, options) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var container = new TestContainer('<default>', createNodeMock);
    var root = TestRenderer.mountContainer(element, container, null, null);
    return {
      toJSON() {
        const hostInstance = TestRenderer.findHostInstance(root);
        if (hostInstance === null) {
          return hostInstance;
        }
        return hostInstance.toJSON();
      },

      update(newElement) {
        TestRenderer.updateContainer(newElement, root, null, null);
      },
      unmount() {
        TestRenderer.updateContainer(null, root, null, () => {
          container = null;
          root = null;
        });
      },
      getInstance() {
        return TestRenderer.getPublicRootInstance(root);
      },
    };
  },

  /* eslint-disable camelcase */
  unstable_batchedUpdates() {
    throw new Error(
      'The unstable_batchedUpdates API no longer exists maybe hopefully'
    );
  },
  /* eslint-enable camelcase */
};

module.exports = ReactTestFiberRenderer;
