/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTestRendererFiberEntry
 * @preventMunge
 * @flow
 */

'use strict';

var ReactFiberReconciler = require('ReactFiberReconciler');
var ReactFiberTreeReflection = require('ReactFiberTreeReflection');
var ReactGenericBatching = require('ReactGenericBatching');
var emptyObject = require('fbjs/lib/emptyObject');
var ReactTypeOfWork = require('ReactTypeOfWork');
var invariant = require('fbjs/lib/invariant');
var {
  Fragment,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
  HostText,
  HostRoot,
} = ReactTypeOfWork;

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';

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

  shouldSetTextContent(type: string, props: Props): boolean {
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

  appendChild: appendChild,
  appendChildToContainer: appendChild,
  insertBefore: insertBefore,
  insertInContainerBefore: insertBefore,
  removeChild: removeChild,
  removeChildFromContainer: removeChild,

  scheduleDeferredCallback(fn: Function): void {
    setTimeout(fn, 0, {timeRemaining: Infinity});
  },

  useSyncScheduling: true,

  getPublicInstance,

  now(): number {
    // Test renderer does not use expiration
    return 0;
  },
});

var defaultTestOptions = {
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

function nodeAndSiblingsTrees(nodeWithSibling: ?Fiber) {
  var array = [];
  var node = nodeWithSibling;
  while (node != null) {
    array.push(node);
    node = node.sibling;
  }
  const trees = array.map(toTree);
  return trees.length ? trees : null;
}

function hasSiblings(node: ?Fiber) {
  return node && node.sibling;
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
        type: node.type,
        props: {...node.memoizedProps},
        instance: node.stateNode,
        rendered: hasSiblings(node.child)
          ? nodeAndSiblingsTrees(node.child)
          : toTree(node.child),
      };
    case FunctionalComponent: // 1
      return {
        nodeType: 'component',
        type: node.type,
        props: {...node.memoizedProps},
        instance: null,
        rendered: hasSiblings(node.child)
          ? nodeAndSiblingsTrees(node.child)
          : toTree(node.child),
      };
    case HostComponent: // 5
      return {
        nodeType: 'host',
        type: node.type,
        props: {...node.memoizedProps},
        instance: null, // TODO: use createNodeMock here somehow?
        rendered: nodeAndSiblingsTrees(node.child),
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
    const fiber = ReactFiberTreeReflection.findCurrentFiberUsingSlowPath(
      this._fiber,
    );
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

  for (const child of root.children) {
    if (typeof child === 'string') {
      continue;
    }
    results.push(...findAll(child, predicate, options));
  }

  return results;
}

function expectOne(
  all: Array<ReactTestInstance>,
  message: string,
): ReactTestInstance {
  if (all.length === 1) {
    return all[0];
  }

  const prefix = all.length === 0
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

var ReactTestRendererFiber = {
  create(element: React$Element<any>, options: TestRendererOptions) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    if (options && typeof options.createNodeMock === 'function') {
      createNodeMock = options.createNodeMock;
    }
    var container = {
      children: [],
      createNodeMock,
      tag: 'CONTAINER',
    };
    var root: FiberRoot | null = TestRenderer.createContainer(container);
    invariant(root != null, 'something went wrong');
    TestRenderer.updateContainer(element, root, null, null);

    var entry = {
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
  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,
  /* eslint-enable camelcase */
};

module.exports = ReactTestRendererFiber;
