/**
 * This is a renderer of React that doesn't have a render target output.
 * It is used to test that the react-reconciler package doesn't blow up.
 *
 * @flow
 */
'use strict';

var React = require('react');
var assert = require('assert');
var ReactFiberReconciler = require('react-reconciler');
var emptyObject = require('fbjs/lib/emptyObject');
var assert = require('assert');

const UPDATE_SIGNAL = {};

var scheduledCallback = null;

type Container = {rootID: string, children: Array<Instance | TextInstance>};
type Props = {prop: any, hidden?: boolean};
type Instance = {|
  type: string,
  id: number,
  children: Array<Instance | TextInstance>,
  prop: any,
|};
type TextInstance = {|text: string, id: number|};

var instanceCounter = 0;

function appendChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance
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
  beforeChild: Instance | TextInstance
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }
  const beforeIndex = parentInstance.children.indexOf(beforeChild);
  if (beforeIndex === -1) {
    throw new Error('This child does not exist.');
  }
  parentInstance.children.splice(beforeIndex, 0, child);
}

function removeChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance
): void {
  const index = parentInstance.children.indexOf(child);
  if (index === -1) {
    throw new Error('This child does not exist.');
  }
  parentInstance.children.splice(index, 1);
}

var NoopRenderer = ReactFiberReconciler({
  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  getPublicInstance(instance) {
    return instance;
  },

  createInstance(type: string, props: Props): Instance {
    const inst = {
      id: instanceCounter++,
      type: type,
      children: [],
      prop: props.prop,
    };
    // Hide from unit tests
    Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
    return inst;
  },

  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance
  ): void {
    parentInstance.children.push(child);
  },

  finalizeInitialChildren(
    domElement: Instance,
    type: string,
    props: Props
  ): boolean {
    return false;
  },

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props
  ): null | {} {
    return UPDATE_SIGNAL;
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  },

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return !!props.hidden;
  },

  now: Date.now,

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object
  ): TextInstance {
    var inst = {text: text, id: instanceCounter++};
    // Hide from unit tests
    Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
    return inst;
  },

  scheduleDeferredCallback(callback) {
    if (scheduledCallback) {
      throw new Error(
        'Scheduling a callback twice is excessive. Instead, keep track of ' +
          'whether the callback has already been scheduled.'
      );
    }
    scheduledCallback = callback;
  },

  prepareForCommit(): void {},

  resetAfterCommit(): void {},

  mutation: {
    commitMount(instance: Instance, type: string, newProps: Props): void {
      // Noop
    },

    commitUpdate(
      instance: Instance,
      updatePayload: Object,
      type: string,
      oldProps: Props,
      newProps: Props
    ): void {
      instance.prop = newProps.prop;
    },

    commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string
    ): void {
      textInstance.text = newText;
    },

    appendChild: appendChild,
    appendChildToContainer: appendChild,
    insertBefore: insertBefore,
    insertInContainerBefore: insertBefore,
    removeChild: removeChild,
    removeChildFromContainer: removeChild,

    resetTextContent(instance: Instance): void {},
  },
});

var rootContainers = new Map();
var roots = new Map();
var DEFAULT_ROOT_ID = '<default>';

let yieldedValues = null;

function* flushUnitsOfWork(n: number): Generator<Array<mixed>, void, void> {
  var didStop = false;
  while (!didStop && scheduledCallback !== null) {
    var cb = scheduledCallback;
    scheduledCallback = null;
    yieldedValues = null;
    var unitsRemaining = n;
    cb({
      timeRemaining() {
        if (yieldedValues !== null) {
          return 0;
        }
        if (unitsRemaining-- > 0) {
          return 999;
        }
        didStop = true;
        return 0;
      },
    });

    if (yieldedValues !== null) {
      const values = yieldedValues;
      yieldedValues = null;
      yield values;
    }
  }
}

var Noop = {
  getChildren(rootID: string = DEFAULT_ROOT_ID) {
    const container = rootContainers.get(rootID);
    if (container) {
      return container.children;
    } else {
      return null;
    }
  },

  // Shortcut for testing a single root
  render(element: React$Element<any>, callback: ?Function) {
    Noop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
  },

  renderToRootWithID(
    element: React$Element<any>,
    rootID: string,
    callback: ?Function
  ) {
    let root = roots.get(rootID);
    if (!root) {
      const container = {rootID: rootID, children: []};
      rootContainers.set(rootID, container);
      root = NoopRenderer.createContainer(container);
      roots.set(rootID, root);
    }
    NoopRenderer.updateContainer(element, root, null, callback);
  },

  flush(): Array<mixed> {
    return Noop.flushUnitsOfWork(Infinity);
  },

  flushUnitsOfWork(n: number): Array<mixed> {
    let values = [];
    for (const value of flushUnitsOfWork(n)) {
      values.push(...value);
    }
    return values;
  },

  batchedUpdates: NoopRenderer.batchedUpdates,

  deferredUpdates: NoopRenderer.deferredUpdates,

  unbatchedUpdates: NoopRenderer.unbatchedUpdates,

  flushSync: NoopRenderer.flushSync,
};

type TestProps = {|
  active: boolean,
|};
type TestState = {|
  counter: number,
|};

let instance = null;
class Test extends React.Component<TestProps, TestState> {
  state = {counter: 0};
  increment() {
    this.setState(({counter}) => ({
      counter: counter + 1,
    }));
  }
  render() {
    return [this.props.active ? 'Active' : 'Inactive', this.state.counter];
  }
}
const Children = props => props.children;
Noop.render(
  <main>
    <div>Hello</div>
    <Children>
      Hello world
      <span>
        {'Number '}
        {42}
      </span>
      <Test active={true} ref={t => (instance = t)} />
    </Children>
  </main>
);
Noop.flush();
const actual1 = Noop.getChildren();
const expected1 = [
  {
    type: 'main',
    children: [
      {type: 'div', children: [], prop: undefined},
      {text: 'Hello world'},
      {
        type: 'span',
        children: [{text: 'Number '}, {text: '42'}],
        prop: undefined,
      },
      {text: 'Active'},
      {text: '0'},
    ],
    prop: undefined,
  },
];
assert.deepEqual(
  actual1,
  expected1,
  'Error. Noop.getChildren() returned unexpected value.\nExpected:  ' +
    JSON.stringify(expected1, null, 2) +
    '\n\nActual:\n  ' +
    JSON.stringify(actual1, null, 2)
);

if (instance === null) {
  throw new Error('Expected instance to exist.');
}

instance.increment();
Noop.flush();
const actual2 = Noop.getChildren();
const expected2 = [
  {
    type: 'main',
    children: [
      {type: 'div', children: [], prop: undefined},
      {text: 'Hello world'},
      {
        type: 'span',
        children: [{text: 'Number '}, {text: '42'}],
        prop: undefined,
      },
      {text: 'Active'},
      {text: '1'},
    ],
    prop: undefined,
  },
];
assert.deepEqual(
  actual2,
  expected2,
  'Error. Noop.getChildren() returned unexpected value.\nExpected:  ' +
    JSON.stringify(expected2, null, 2) +
    '\n\nActual:\n  ' +
    JSON.stringify(actual2, null, 2)
);

const beginGreen = '\u001b[32m';
const endGreen = '\u001b[39m';
console.log(beginGreen + 'Reconciler package is OK!' + endGreen);
