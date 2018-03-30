/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';

import ReactFiberReconciler from 'react-reconciler';
import {batchedUpdates} from 'events/ReactGenericBatching';
import {findCurrentFiberUsingSlowPath} from 'react-reconciler/reflection';
import emptyObject from 'fbjs/lib/emptyObject';
import {
  Fragment,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
  HostPortal,
  HostText,
  HostRoot,
} from 'shared/ReactTypeOfWork';
import invariant from 'fbjs/lib/invariant';

type TestRendererOptions = {
  createNodeMock: (element: React$Element<any>) => any,
};

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

type FindOptions = $Shape<{
  // performs a "greedy" search: if a matching node is found, will continue
  // to search within the matching node's children. (default: true)
  deep: boolean,
}>;

export type Predicate = (node: ReactTestInstance) => ?boolean;

const UPDATE_SIGNAL = {};

function getPublicInstance(inst: Instance | TextInstance): * {
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
}

function appendChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }
  parentInstance.children.push(child);
}

function insertBefore(
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
}

function removeChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  parentInstance.children.splice(index, 1);
}

const TestRenderer = ReactFiberReconciler({
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

  shouldSetTextContent(type: string, props: Props): boolean {
    return false;
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

  scheduleDeferredCallback(fn: Function): number {
    return setTimeout(fn, 0, {timeRemaining: Infinity});
  },

  cancelDeferredCallback(timeoutID: number): void {
    clearTimeout(timeoutID);
  },

  getPublicInstance,

  now(): number {
    // Test renderer does not use expiration
    return 0;
  },

  mutation: {
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

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      textInstance.text = newText;
    },
    resetTextContent(testElement: Instance): void {
      // noop
    },

    appendChild: appendChild,
    appendChildToContainer: appendChild,
    insertBefore: insertBefore,
    insertInContainerBefore: insertBefore,
    removeChild: removeChild,
    removeChildFromContainer: removeChild,
  },
});

const defaultTestOptions = {
  createNodeMock: function() {
    return null;
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

function childrenToTree(node) {
  if (!node) {
    return null;
  }
  const children = nodeAndSiblingsArray(node);
  if (children.length === 0) {
    return null;
  } else if (children.length === 1) {
    return toTree(children[0]);
  }
  return flatten(children.map(toTree));
}

function nodeAndSiblingsArray(nodeWithSibling) {
  const array = [];
  let node = nodeWithSibling;
  while (node != null) {
    array.push(node);
    node = node.sibling;
  }
  return array;
}

function flatten(arr) {
  const result = [];
  const stack = [{i: 0, array: arr}];
  while (stack.length) {
    const n = stack.pop();
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

function toTree(node: ?Fiber) {
  if (node == null) {
    return null;
  }
  switch (node.tag) {
    case HostRoot:
      return childrenToTree(node.child);
    case HostPortal:
      return childrenToTree(node.child);
    case ClassComponent:
      return {
        nodeType: 'component',
        type: node.type,
        props: {...node.memoizedProps},
        instance: node.stateNode,
        rendered: childrenToTree(node.child),
      };
    case FunctionalComponent:
      return {
        nodeType: 'component',
        type: node.type,
        props: {...node.memoizedProps},
        instance: null,
        rendered: childrenToTree(node.child),
      };
    case HostComponent: {
      return {
        nodeType: 'host',
        type: node.type,
        props: {...node.memoizedProps},
        instance: null, // TODO: use createNodeMock here somehow?
        rendered: flatten(nodeAndSiblingsArray(node.child).map(toTree)),
      };
    }
    case HostText:
      return node.stateNode.text;
    case Fragment:
      return childrenToTree(node.child);
    default:
      invariant(
        false,
        'toTree() does not yet know how to handle nodes with tag=%s',
        node.tag,
      );
  }
}

const fiberToWrapper = new WeakMap();
function wrapFiber(fiber: Fiber): ReactTestInstance {
  let wrapper = fiberToWrapper.get(fiber);
  if (wrapper === undefined && fiber.alternate !== null) {
    wrapper = fiberToWrapper.get(fiber.alternate);
  }
  if (wrapper === undefined) {
    wrapper = new ReactTestInstance(fiber);
    fiberToWrapper.set(fiber, wrapper);
  }
  return wrapper;
}

const validWrapperTypes = new Set([
  FunctionalComponent,
  ClassComponent,
  HostComponent,
]);

class ReactTestInstance {
  _fiber: Fiber;

  _currentFiber(): Fiber {
    // Throws if this component has been unmounted.
    const fiber = findCurrentFiberUsingSlowPath(this._fiber);
    invariant(
      fiber !== null,
      "Can't read from currently-mounting component. This error is likely " +
        'caused by a bug in React. Please file an issue.',
    );
    return fiber;
  }

  constructor(fiber: Fiber) {
    invariant(
      validWrapperTypes.has(fiber.tag),
      'Unexpected object passed to ReactTestInstance constructor (tag: %s). ' +
        'This is probably a bug in React.',
      fiber.tag,
    );
    this._fiber = fiber;
  }

  get instance() {
    if (this._fiber.tag === HostComponent) {
      return getPublicInstance(this._fiber.stateNode);
    } else {
      return this._fiber.stateNode;
    }
  }

  get type() {
    return this._fiber.type;
  }

  get props(): Object {
    return this._currentFiber().memoizedProps;
  }

  get parent(): ?ReactTestInstance {
    const parent = this._fiber.return;
    return parent === null || parent.tag === HostRoot
      ? null
      : wrapFiber(parent);
  }

  get children(): Array<ReactTestInstance | string> {
    const children = [];
    const startingNode = this._currentFiber();
    let node: Fiber = startingNode;
    if (node.child === null) {
      return children;
    }
    node.child.return = node;
    node = node.child;
    outer: while (true) {
      let descend = false;
      switch (node.tag) {
        case FunctionalComponent:
        case ClassComponent:
        case HostComponent:
          children.push(wrapFiber(node));
          break;
        case HostText:
          children.push('' + node.memoizedProps);
          break;
        case Fragment:
          descend = true;
          break;
        default:
          invariant(
            false,
            'Unsupported component type %s in test renderer. ' +
              'This is probably a bug in React.',
            node.tag,
          );
      }
      if (descend && node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      while (node.sibling === null) {
        if (node.return === startingNode) {
          break outer;
        }
        node = (node.return: any);
      }
      (node.sibling: any).return = node.return;
      node = (node.sibling: any);
    }
    return children;
  }

  // Custom search functions
  find(predicate: Predicate): ReactTestInstance {
    return expectOne(
      this.findAll(predicate, {deep: false}),
      `matching custom predicate: ${predicate.toString()}`,
    );
  }

  findByType(type: any): ReactTestInstance {
    return expectOne(
      this.findAllByType(type, {deep: false}),
      `with node type: "${type.displayName || type.name}"`,
    );
  }

  findByProps(props: Object): ReactTestInstance {
    return expectOne(
      this.findAllByProps(props, {deep: false}),
      `with props: ${JSON.stringify(props)}`,
    );
  }

  findAll(
    predicate: Predicate,
    options: ?FindOptions = null,
  ): Array<ReactTestInstance> {
    return findAll(this, predicate, options);
  }

  findAllByType(
    type: any,
    options: ?FindOptions = null,
  ): Array<ReactTestInstance> {
    return findAll(this, node => node.type === type, options);
  }

  findAllByProps(
    props: Object,
    options: ?FindOptions = null,
  ): Array<ReactTestInstance> {
    return findAll(
      this,
      node => node.props && propsMatch(node.props, props),
      options,
    );
  }
}

function findAll(
  root: ReactTestInstance,
  predicate: Predicate,
  options: ?FindOptions,
): Array<ReactTestInstance> {
  const deep = options ? options.deep : true;
  const results = [];

  if (predicate(root)) {
    results.push(root);
    if (!deep) {
      return results;
    }
  }

  root.children.forEach(child => {
    if (typeof child === 'string') {
      return;
    }
    results.push(...findAll(child, predicate, options));
  });

  return results;
}

function expectOne(
  all: Array<ReactTestInstance>,
  message: string,
): ReactTestInstance {
  if (all.length === 1) {
    return all[0];
  }

  const prefix =
    all.length === 0
      ? 'No instances found '
      : `Expected 1 but found ${all.length} instances `;

  throw new Error(prefix + message);
}

function propsMatch(props: Object, filter: Object): boolean {
  for (const key in filter) {
    if (props[key] !== filter[key]) {
      return false;
    }
  }
  return true;
}

const ReactTestRendererFiber = {
  create(element: React$Element<any>, options: TestRendererOptions) {
    let createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    let container = {
      children: [],
      createNodeMock,
      tag: 'CONTAINER',
    };
    let root: FiberRoot | null = TestRenderer.createContainer(
      container,
      false,
      false,
    );
    invariant(root != null, 'something went wrong');
    TestRenderer.updateContainer(element, root, null, null);

    const entry = {
      root: undefined, // makes flow happy
      // we define a 'getter' for 'root' below using 'Object.defineProperty'
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
      update(newElement: React$Element<any>) {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(newElement, root, null, null);
      },
      unmount() {
        if (root == null || root.current == null) {
          return;
        }
        TestRenderer.updateContainer(null, root, null, null);
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

    Object.defineProperty(
      entry,
      'root',
      ({
        configurable: true,
        enumerable: true,
        get: function() {
          if (root === null || root.current.child === null) {
            throw new Error("Can't access .root on unmounted test renderer");
          }
          return wrapFiber(root.current.child);
        },
      }: Object),
    );

    return entry;
  },

  /* eslint-disable camelcase */
  unstable_batchedUpdates: batchedUpdates,
  /* eslint-enable camelcase */
};

export default ReactTestRendererFiber;
