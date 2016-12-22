/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestFiberRenderer
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

var createElement = (type, rawProps, rootContainerInstance) => {
  const {children, ...props} = rawProps;
  var inst = {
    id: instanceCounter++,
    type: type,
    children: typeof children === 'undefined' ? null : Array.isArray(children) ? children : [children],
    props: props,
  };
  // Hide from unit tests
  Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
  Object.defineProperty(inst, '$$typeof', {
    value: Symbol.for('react.test.json'),
  });
  // todo: something like this?
  // const mockInst = rootContainerInstance.createNodeMock(inst);
  return inst;
};

var setInitialProperties = () => {
  throw new Error('TODO: setInitialProperties');
};

var updateProperties = (element, type, oldProps, newProps) => {
  const {children, ...props} = newProps;
  element.type = type;
  element.props = props;
  element.children = typeof children === 'undefined' ? null : Array.isArray(children) ? children : [children];
};

var DEFAULT_ROOT_ID = '<default>';

let instanceCounter = 0;
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
    const inst = createElement(type, props, rootContainerInstance);
    return inst;
  },

  appendInitialChild(parentInstance : Instance, child : Instance | TextInstance) : void {
    const appliedChild = child.text ? String(child.text) : child;
    if (parentInstance.children == null) {
      parentInstance.children = appliedChild;
    } else if (Array.isArray(parentInstance.children)) {
      parentInstance.children =
        parentInstance.children.concat(appliedChild);
    } else {
      // parentInstance.children = appliedChild;
    }
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
    // Update the internal instance handle so that we know which props are
    // the current ones.
    // precacheFiberNode(internalInstanceHandle, testElement);
    updateProperties(instance, type, oldProps, newProps);
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
    // return text;
    var inst = { text : text, id: instanceCounter++ };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', { value: inst.id, enumerable: false });
    return inst;
  },

  commitTextUpdate(textInstance : TextInstance, oldText : string, newText : string) : void {
    textInstance.text = newText;
  },

  appendChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    if (parentInstance.children === null) {
      parentInstance.children = [child];
    } else {
      const index = parentInstance.children.indexOf(child);
      if (index !== -1) {
        parentInstance.children.splice(index, 1);
      }
      parentInstance.children.push(child);
    }
  },

  insertBefore(
    parentInstance : Instance | Container,
    child : Instance | TextInstance,
    beforeChild : Instance | TextInstance
  ) : void {
    console.log('insertBefore');
    if (parentInstance.children === null) {
      throw new Error('This child does not exist.');
    }
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    const beforeIndex = parentInstance.children.indexOf(beforeChild);
    if (beforeIndex === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(beforeIndex, 0, child);
  },

  removeChild(parentInstance : Instance | Container, child : Instance | TextInstance) : void {
    if (parentInstance.children === null) {
      throw new Error('This child does not exist.');
    }
    const index = parentInstance.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(index, 1);
  },

  getPublicInstance(
    privateInstance : Instance | Container,
    hostContainerInfo
  ) {
    console.log('TODO: implement me for getNodeMock');
  },

  scheduleAnimationCallback: window.requestAnimationFrame,

  scheduleDeferredCallback: window.requestIdleCallback,

  useSyncScheduling: true,
});

const rootContainers = new Map();
const roots = new Map();

var defaultTestOptions = {
  createNodeMock: function() {
    return null;
  },
};

var toJSON = (instance) => {
  var {children, ...json} = instance;
  Object.defineProperty(json, '$$typeof', {value: Symbol.for('react.test.json')});

  var childrenJSON = [];
  if (children) {
    children.forEach((child) => {
      if (child.$$typeof === Symbol.for('react.element')) {
        // childrenJSON.push(toJSON(child));
        // skip maybe console.log('TODO: getPublicInstance');
        // probably recurse
      } else {
        childrenJSON.push(child);
      }
    });
  }
  json.children = childrenJSON.length ? childrenJSON : null;
  return json;
};

var ReactTestFiberRenderer = {
  toJSON(rootID : string = DEFAULT_ROOT_ID) {
    const root = roots.get(rootID);
    const rootContainer = rootContainers.get(rootID);
    if (!root || !rootContainer) {
      console.log('Nothing rendered yet.');
      return;
    }

    const hostInstance = TestRenderer.findHostInstance(root);
    if (hostInstance === null) {
      return hostInstance;
    }

    return toJSON(hostInstance);
  },

  create(element, rootID = DEFAULT_ROOT_ID, callback) {
    const container = { rootID: rootID, children: [], createNodeMock: defaultTestOptions.createNodeMock };
    rootContainers.set(rootID, container);
    const root = TestRenderer.mountContainer(element, container, null, callback);
    roots.set(rootID, root);
    return {
      toJSON() {
        return ReactTestFiberRenderer.toJSON(rootID);
      },
      update(element) {
        const root = roots.get(rootID);
        TestRenderer.updateContainer(element, root, null, callback);
      },
      unmount() {
        TestRenderer.updateContainer(null, root, null, () => {
          rootContainers.delete(rootID);
          roots.delete(rootID, root);
        });
      },
      getInstance() {
        return TestRenderer.getPublicRootInstance(roots.get(rootID));
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
