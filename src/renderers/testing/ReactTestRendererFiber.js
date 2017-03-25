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
var emptyObject = require('fbjs/lib/emptyObject');
var ReactTypeOfWork = require('ReactTypeOfWork');
var invariant = require('fbjs/lib/invariant');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
  Fragment,
  HostText,
  HostRoot,
} = ReactTypeOfWork;

import type {TestRendererOptions} from 'ReactTestMount';
import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';

type ReactTestRendererJSON = {|
  type: string,
  props: {[propName: string]: any},
  children: null | Array<ReactTestRendererNode>,
  $$typeof?: Symbol, // Optional because we add it with defineProperty().
|};
type ReactTestRendererNode = ReactTestRendererJSON | string;

type Container = {|
  children: Array<Instance | TextInstance>,
  createNodeMock: Function,
  createComponentMock: Function,
  tag: 'CONTAINER',
|};

type Props = Object;
type Instance = {|
  type: string,
  props: Object,
  children: Array<Instance | TextInstance>,
  rootContainerInstance: Container,
  tag: 'INSTANCE',
|};

type TextInstance = {|
  text: string,
  tag: 'TEXT',
|};

const UPDATE_SIGNAL = {};

var TestRenderer = ReactFiberReconciler({
  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  prepareForCommit(): void {
    // noop
  },

  resetAfterCommit(): void {
    // noop
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
  ): Instance {
    return {
      type,
      props,
      children: [],
      rootContainerInstance,
      tag: 'INSTANCE',
    };
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },

  finalizeInitialChildren(
    testElement: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    return false;
  },

  prepareUpdate(
    testElement: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: Object,
  ): null | {} {
    return UPDATE_SIGNAL;
  },

  commitUpdate(
    instance: Instance,
    updatePayload: {},
    type: string,
    oldProps: Props,
    newProps: Props,
    internalInstanceHandle: Object,
  ): void {
    instance.type = type;
    instance.props = newProps;
  },

  commitMount(
    instance: Instance,
    type: string,
    newProps: Props,
    internalInstanceHandle: Object,
  ): void {
    // noop
  },

  shouldSetTextContent(props: Props): boolean {
    return false;
  },

  resetTextContent(testElement: Instance): void {
    // noop
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
  ): TextInstance {
    return {
      text,
      tag: 'TEXT',
    };
  },

  commitTextUpdate(
    textInstance: TextInstance,
    oldText: string,
    newText: string,
  ): void {
    textInstance.text = newText;
  },

  appendChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  },

  insertBefore(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    const beforeIndex = parentInstance.children.indexOf(beforeChild);
    parentInstance.children.splice(beforeIndex, 0, child);
  },

  removeChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    parentInstance.children.splice(index, 1);
  },

  scheduleAnimationCallback(fn: Function): void {
    setTimeout(fn);
  },

  scheduleDeferredCallback(fn: Function): void {
    setTimeout(fn, 0, {timeRemaining: Infinity});
  },

  mockComponent(component: Fiber, rootContainer: Container) {
    invariant(
      component._unmockedType === null,
      'Trying to mock an already mocked component',
    );
    const mockedFn = rootContainer.createComponentMock({
      type: component.type,
      props: component.pendingProps,
    });
    invariant(
      typeof mockedFn === 'function',
      'createComponentMock() must return a function. Found %s instead.',
      typeof mockedFn,
    );
    if (mockedFn !== component.type) {
      component._unmockedType = component.type;
      component.type = mockedFn;
      // force the fiber to be indeterminate so that users can mock a class component
      // into a functional component and vice versa
      component.tag = IndeterminateComponent;
    }
  },

  useSyncScheduling: true,

  getPublicInstance(inst) {
    switch (inst.tag) {
      case 'INSTANCE':
        const createNodeMock = inst.rootContainerInstance.createNodeMock;
        return createNodeMock({
          type: inst.type,
          props: inst.props,
        });
      default:
        return inst;
    }
  },
});

var defaultTestOptions = {
  createNodeMock: function() {
    return null;
  },
  createComponentMock: function(component: {type: Function, props: any}) {
    return component.type;
  },
};

function toJSON(inst: Instance | TextInstance): ReactTestRendererNode {
  switch (inst.tag) {
    case 'TEXT':
      return inst.text;
    case 'INSTANCE':
      /* eslint-disable no-unused-vars */
      // We don't include the `children` prop in JSON.
      // Instead, we will include the actual rendered children.
      const {children, ...props} = inst.props;
      /* eslint-enable */
      let renderedChildren = null;
      if (inst.children && inst.children.length) {
        renderedChildren = inst.children.map(toJSON);
      }
      const json: ReactTestRendererJSON = {
        type: inst.type,
        props: props,
        children: renderedChildren,
      };
      Object.defineProperty(json, '$$typeof', {
        value: Symbol.for('react.test.json'),
      });
      return json;
    default:
      throw new Error(`Unexpected node type in toJSON: ${inst.tag}`);
  }
}

function nodeAndSiblingsArray(nodeWithSibling: ?Fiber) {
  var array = [];
  var node = nodeWithSibling;
  while (node != null) {
    array.push(node);
    node = node.sibling;
  }
  return array;
}

function childrenToTree(node) {
  if (!node) {
    return null;
  }
  const children = nodeAndSiblingsArray(node);
  if (children.length === 0) {
    return null;
  } else if (children.length === 1) {
    return toTree(children[0]);
  } else {
    return flatten(children.map(toTree));
  }
}

function flatten(arr) {
  const result = [];
  const stack = [{i: 0, array: arr}];
  while (stack.length) {
    let n = stack.pop();
    while (n.i < n.array.length) {
      const el = n.array[n.i];
      n.i += 1;
      if (Array.isArray(el)) {
        stack.push(n);
        stack.push({i: 0, array: el});
        break;
      }
      result.push(el);
    }
  }
  return result;
}

function publicType(node: Fiber) {
  if (node._unmockedType !== null) {
    return node._unmockedType;
  }
  return node.type;
}

function toTree(node: ?Fiber) {
  if (node == null) {
    return null;
  }
  switch (node.tag) {
    case HostRoot: // 3
      return toTree(node.child);
    case ClassComponent:
      return {
        nodeType: 'component',
        type: publicType(node),
        props: {...node.memoizedProps},
        instance: node.stateNode,
        rendered: childrenToTree(node.child),
      };
    case Fragment: // 10
      return childrenToTree(node.child);
    case FunctionalComponent: // 1
      return {
        nodeType: 'component',
        type: publicType(node),
        props: {...node.memoizedProps},
        instance: null,
        rendered: childrenToTree(node.child),
      };
    case HostComponent: // 5
      return {
        nodeType: 'host',
        type: node.type,
        props: {...node.memoizedProps},
        instance: null, // TODO: use createNodeMock here somehow?
        rendered: flatten(nodeAndSiblingsArray(node.child).map(toTree)),
      };
    case HostText: // 6
      return node.stateNode.text;
    default:
      invariant(
        false,
        'toTree() does not yet know how to handle nodes with tag=%s',
        node.tag,
      );
  }
}

var ReactTestFiberRenderer = {
  create(element: ReactElement<any>, options: TestRendererOptions) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var createComponentMock = defaultTestOptions.createComponentMock;
    if (options && typeof options.createComponentMock === 'function') {
      createComponentMock = options.createComponentMock;
    }
    var container = {
      children: [],
      createNodeMock,
      createComponentMock,
      tag: 'CONTAINER',
    };
    var root: ?FiberRoot = TestRenderer.createContainer(container);
    invariant(root != null, 'something went wrong');
    TestRenderer.updateContainer(element, root, null, null);

    return {
      toJSON() {
        if (root == null || root.current == null || container == null) {
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
      toTree() {
        if (root == null || root.current == null) {
          return null;
        }
        return toTree(root.current);
      },
      update(newElement: ReactElement<any>) {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(newElement, root, null, null);
      },
      unmount() {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(null, root, null);
        container = null;
        root = null;
      },
      getInstance() {
        if (root == null || root.current == null) {
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
