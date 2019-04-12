/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import type {Thenable} from 'react-reconciler/src/ReactFiberScheduler';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {UpdateQueue} from 'react-reconciler/src/ReactUpdateQueue';
import type {ReactNodeList} from 'shared/ReactTypes';

import * as Scheduler from 'scheduler/unstable_mock';
import {createPortal} from 'shared/ReactPortal';
import expect from 'expect';
import {
  REACT_FRAGMENT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_EVENT_TARGET_TOUCH_HIT,
} from 'shared/ReactSymbols';
import warning from 'shared/warning';
import enqueueTask from 'shared/enqueueTask';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import warningWithoutStack from 'shared/warningWithoutStack';
import {enableEventAPI} from 'shared/ReactFeatureFlags';

type EventTargetChildElement = {
  type: string,
  props: null | {
    style?: {
      position?: string,
      bottom?: string,
      left?: string,
      right?: string,
      top?: string,
    },
  },
};
type Container = {
  rootID: string,
  children: Array<Instance | TextInstance>,
  pendingChildren: Array<Instance | TextInstance>,
};
type Props = {
  prop: any,
  hidden: boolean,
  children?: mixed,
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
};
type Instance = {|
  type: string,
  id: number,
  children: Array<Instance | TextInstance>,
  text: string | null,
  prop: any,
  hidden: boolean,
  context: HostContext,
|};
type TextInstance = {|
  text: string,
  id: number,
  hidden: boolean,
  context: HostContext,
|};
type HostContext = Object;

const {ReactShouldWarnActingUpdates} = ReactSharedInternals;

const NO_CONTEXT = {};
const UPPERCASE_CONTEXT = {};
const EVENT_COMPONENT_CONTEXT = {};
const EVENT_TARGET_CONTEXT = {};
const EVENT_TOUCH_HIT_TARGET_CONTEXT = {};
const UPDATE_SIGNAL = {};
if (__DEV__) {
  Object.freeze(NO_CONTEXT);
  Object.freeze(UPDATE_SIGNAL);
}

function createReactNoop(reconciler: Function, useMutation: boolean) {
  let instanceCounter = 0;
  let hostDiffCounter = 0;
  let hostUpdateCounter = 0;
  let hostCloneCounter = 0;

  function appendChildToContainerOrInstance(
    parentInstance: Container | Instance,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  }

  function appendChildToContainer(
    parentInstance: Container,
    child: Instance | TextInstance,
  ): void {
    if (typeof parentInstance.rootID !== 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error(
        'appendChildToContainer() first argument is not a container.',
      );
    }
    appendChildToContainerOrInstance(parentInstance, child);
  }

  function appendChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    if (typeof (parentInstance: any).rootID === 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error('appendChild() first argument is not an instance.');
    }
    appendChildToContainerOrInstance(parentInstance, child);
  }

  function insertInContainerOrInstanceBefore(
    parentInstance: Container | Instance,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
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

  function insertInContainerBefore(
    parentInstance: Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ) {
    if (typeof parentInstance.rootID !== 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error(
        'insertInContainerBefore() first argument is not a container.',
      );
    }
    insertInContainerOrInstanceBefore(parentInstance, child, beforeChild);
  }

  function insertBefore(
    parentInstance: Instance,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
  ) {
    if (typeof (parentInstance: any).rootID === 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error('insertBefore() first argument is not an instance.');
    }
    insertInContainerOrInstanceBefore(parentInstance, child, beforeChild);
  }

  function removeChildFromContainerOrInstance(
    parentInstance: Container | Instance,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index === -1) {
      throw new Error('This child does not exist.');
    }
    parentInstance.children.splice(index, 1);
  }

  function removeChildFromContainer(
    parentInstance: Container,
    child: Instance | TextInstance,
  ): void {
    if (typeof parentInstance.rootID !== 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error(
        'removeChildFromContainer() first argument is not a container.',
      );
    }
    removeChildFromContainerOrInstance(parentInstance, child);
  }

  function removeChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    if (typeof (parentInstance: any).rootID === 'string') {
      // Some calls to this aren't typesafe.
      // This helps surface mistakes in tests.
      throw new Error('removeChild() first argument is not an instance.');
    }
    removeChildFromContainerOrInstance(parentInstance, child);
  }

  function cloneInstance(
    instance: Instance,
    updatePayload: null | Object,
    type: string,
    oldProps: Props,
    newProps: Props,
    internalInstanceHandle: Object,
    keepChildren: boolean,
    recyclableInstance: null | Instance,
  ): Instance {
    const clone = {
      id: instance.id,
      type: type,
      children: keepChildren ? instance.children : [],
      text: shouldSetTextContent(type, newProps)
        ? computeText((newProps.children: any) + '', instance.context)
        : null,
      prop: newProps.prop,
      hidden: newProps.hidden === true,
      context: instance.context,
    };
    Object.defineProperty(clone, 'id', {
      value: clone.id,
      enumerable: false,
    });
    Object.defineProperty(clone, 'text', {
      value: clone.text,
      enumerable: false,
    });
    Object.defineProperty(clone, 'context', {
      value: clone.context,
      enumerable: false,
    });
    hostCloneCounter++;
    return clone;
  }

  function shouldSetTextContent(type: string, props: Props): boolean {
    if (type === 'errorInBeginPhase') {
      throw new Error('Error in host config.');
    }
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  }

  function computeText(rawText, hostContext) {
    return hostContext === UPPERCASE_CONTEXT ? rawText.toUpperCase() : rawText;
  }

  const sharedHostConfig = {
    getRootHostContext() {
      return NO_CONTEXT;
    },

    getChildHostContext(
      parentHostContext: HostContext,
      type: string,
      rootcontainerInstance: Container,
    ) {
      if (type === 'uppercase') {
        return UPPERCASE_CONTEXT;
      }
      return NO_CONTEXT;
    },

    getChildHostContextForEventComponent(parentHostContext: HostContext) {
      if (__DEV__ && enableEventAPI) {
        warning(
          parentHostContext !== EVENT_TARGET_CONTEXT &&
            parentHostContext !== EVENT_TOUCH_HIT_TARGET_CONTEXT,
          'validateDOMNesting: React event targets must not have event components as children.',
        );
        return EVENT_COMPONENT_CONTEXT;
      }
      return parentHostContext;
    },

    getChildHostContextForEventTarget(
      parentHostContext: HostContext,
      type: Symbol | number,
    ) {
      if (__DEV__ && enableEventAPI) {
        if (type === REACT_EVENT_TARGET_TOUCH_HIT) {
          warning(
            parentHostContext !== EVENT_COMPONENT_CONTEXT,
            'validateDOMNesting: <TouchHitTarget> cannot not be a direct child of an event component. ' +
              'Ensure <TouchHitTarget> is a direct child of a DOM element.',
          );
          return EVENT_TOUCH_HIT_TARGET_CONTEXT;
        }
        return EVENT_TARGET_CONTEXT;
      }
      return parentHostContext;
    },

    getPublicInstance(instance) {
      return instance;
    },

    createInstance(
      type: string,
      props: Props,
      rootContainerInstance: Container,
      hostContext: HostContext,
    ): Instance {
      if (type === 'errorInCompletePhase') {
        throw new Error('Error in host config.');
      }
      const inst = {
        id: instanceCounter++,
        type: type,
        children: [],
        text: shouldSetTextContent(type, props)
          ? computeText((props.children: any) + '', hostContext)
          : null,
        prop: props.prop,
        hidden: props.hidden === true,
        context: hostContext,
      };
      // Hide from unit tests
      Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
      Object.defineProperty(inst, 'text', {
        value: inst.text,
        enumerable: false,
      });
      Object.defineProperty(inst, 'context', {
        value: inst.context,
        enumerable: false,
      });
      return inst;
    },

    appendInitialChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      parentInstance.children.push(child);
    },

    finalizeInitialChildren(
      domElement: Instance,
      type: string,
      props: Props,
    ): boolean {
      return false;
    },

    prepareUpdate(
      instance: Instance,
      type: string,
      oldProps: Props,
      newProps: Props,
    ): null | {} {
      if (type === 'errorInCompletePhase') {
        throw new Error('Error in host config.');
      }
      if (oldProps === null) {
        throw new Error('Should have old props');
      }
      if (newProps === null) {
        throw new Error('Should have new props');
      }
      hostDiffCounter++;
      return UPDATE_SIGNAL;
    },

    shouldSetTextContent,

    shouldDeprioritizeSubtree(type: string, props: Props): boolean {
      return !!props.hidden;
    },

    createTextInstance(
      text: string,
      rootContainerInstance: Container,
      hostContext: Object,
      internalInstanceHandle: Object,
    ): TextInstance {
      if (__DEV__ && enableEventAPI) {
        warning(
          hostContext !== EVENT_COMPONENT_CONTEXT,
          'validateDOMNesting: React event components cannot have text DOM nodes as children. ' +
            'Wrap the child text "%s" in an element.',
          text,
        );
      }
      if (hostContext === UPPERCASE_CONTEXT) {
        text = text.toUpperCase();
      }
      const inst = {
        text: text,
        id: instanceCounter++,
        hidden: false,
        context: hostContext,
      };
      // Hide from unit tests
      Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
      Object.defineProperty(inst, 'context', {
        value: inst.context,
        enumerable: false,
      });
      return inst;
    },

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,

    prepareForCommit(): void {},

    resetAfterCommit(): void {},

    now: Scheduler.unstable_now,

    isPrimaryRenderer: true,
    supportsHydration: false,

    mountEventComponent(): void {
      // NO-OP
    },

    updateEventComponent(): void {
      // NO-OP
    },

    unmountEventComponent(): void {
      // NO-OP
    },

    getEventTargetChildElement(
      type: Symbol | number,
      props: Props,
    ): null | EventTargetChildElement {
      if (enableEventAPI) {
        if (type === REACT_EVENT_TARGET_TOUCH_HIT) {
          const {bottom, left, right, top} = props;

          if (!bottom && !left && !right && !top) {
            return null;
          }
          return {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                zIndex: -1,
                bottom: bottom ? `-${bottom}px` : '0px',
                left: left ? `-${left}px` : '0px',
                right: right ? `-${right}px` : '0px',
                top: top ? `-${top}px` : '0px',
              },
            },
          };
        }
      }
      return null;
    },

    handleEventTarget(
      type: Symbol | number,
      props: Props,
      rootContainerInstance: Container,
      internalInstanceHandle: Object,
    ): boolean {
      return false;
    },

    commitEventTarget(
      type: Symbol | number,
      props: Props,
      instance: Instance,
      parentInstance: Instance,
    ): void {
      // NO-OP
    },
  };

  const hostConfig = useMutation
    ? {
        ...sharedHostConfig,

        supportsMutation: true,
        supportsPersistence: false,

        commitMount(instance: Instance, type: string, newProps: Props): void {
          // Noop
        },

        commitUpdate(
          instance: Instance,
          updatePayload: Object,
          type: string,
          oldProps: Props,
          newProps: Props,
        ): void {
          if (oldProps === null) {
            throw new Error('Should have old props');
          }
          hostUpdateCounter++;
          instance.prop = newProps.prop;
          instance.hidden = newProps.hidden === true;
          if (shouldSetTextContent(type, newProps)) {
            instance.text = computeText(
              (newProps.children: any) + '',
              instance.context,
            );
          }
        },

        commitTextUpdate(
          textInstance: TextInstance,
          oldText: string,
          newText: string,
        ): void {
          hostUpdateCounter++;
          textInstance.text = computeText(newText, textInstance.context);
        },

        appendChild,
        appendChildToContainer,
        insertBefore,
        insertInContainerBefore,
        removeChild,
        removeChildFromContainer,

        hideInstance(instance: Instance): void {
          instance.hidden = true;
        },

        hideTextInstance(textInstance: TextInstance): void {
          textInstance.hidden = true;
        },

        unhideInstance(instance: Instance, props: Props): void {
          if (!props.hidden) {
            instance.hidden = false;
          }
        },

        unhideTextInstance(textInstance: TextInstance, text: string): void {
          textInstance.hidden = false;
        },

        resetTextContent(instance: Instance): void {
          instance.text = null;
        },
      }
    : {
        ...sharedHostConfig,
        supportsMutation: false,
        supportsPersistence: true,

        cloneInstance,

        createContainerChildSet(
          container: Container,
        ): Array<Instance | TextInstance> {
          return [];
        },

        appendChildToContainerChildSet(
          childSet: Array<Instance | TextInstance>,
          child: Instance | TextInstance,
        ): void {
          childSet.push(child);
        },

        finalizeContainerChildren(
          container: Container,
          newChildren: Array<Instance | TextInstance>,
        ): void {
          container.pendingChildren = newChildren;
        },

        replaceContainerChildren(
          container: Container,
          newChildren: Array<Instance | TextInstance>,
        ): void {
          container.children = newChildren;
        },

        cloneHiddenInstance(
          instance: Instance,
          type: string,
          props: Props,
          internalInstanceHandle: Object,
        ): Instance {
          const clone = cloneInstance(
            instance,
            null,
            type,
            props,
            props,
            internalInstanceHandle,
            true,
            null,
          );
          clone.hidden = true;
          return clone;
        },

        cloneHiddenTextInstance(
          instance: TextInstance,
          text: string,
          internalInstanceHandle: Object,
        ): TextInstance {
          const clone = {
            text: instance.text,
            id: instanceCounter++,
            hidden: true,
            context: instance.context,
          };
          // Hide from unit tests
          Object.defineProperty(clone, 'id', {
            value: clone.id,
            enumerable: false,
          });
          Object.defineProperty(clone, 'context', {
            value: clone.context,
            enumerable: false,
          });
          return clone;
        },
      };

  const NoopRenderer = reconciler(hostConfig);

  const rootContainers = new Map();
  const roots = new Map();
  const DEFAULT_ROOT_ID = '<default>';

  const {
    flushPassiveEffects,
    batchedUpdates,
    ReactActingUpdatesSigil,
  } = NoopRenderer;

  // this act() implementation should be exactly the same in
  // ReactTestUtilsAct.js, ReactTestRendererAct.js, createReactNoop.js

  // we track the 'depth' of the act() calls with this counter,
  // so we can tell if any async act() calls try to run in parallel.
  let actingUpdatesScopeDepth = 0;

  function flushEffectsAndMicroTasks(onDone: (err: ?Error) => void) {
    try {
      flushPassiveEffects();
      enqueueTask(() => {
        if (flushPassiveEffects()) {
          flushEffectsAndMicroTasks(onDone);
        } else {
          onDone();
        }
      });
    } catch (err) {
      onDone(err);
    }
  }

  function act(callback: () => Thenable) {
    let previousActingUpdatesScopeDepth;
    let previousActingUpdatesSigil;
    if (__DEV__) {
      previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
      previousActingUpdatesSigil = ReactShouldWarnActingUpdates.current;
      actingUpdatesScopeDepth++;
      ReactShouldWarnActingUpdates.current = ReactActingUpdatesSigil;
    }

    function onDone() {
      if (__DEV__) {
        actingUpdatesScopeDepth--;
        ReactShouldWarnActingUpdates.current = previousActingUpdatesSigil;
        if (actingUpdatesScopeDepth > previousActingUpdatesScopeDepth) {
          // if it's _less than_ previousActingUpdatesScopeDepth, then we can assume the 'other' one has warned
          warningWithoutStack(
            null,
            'You seem to have overlapping act() calls, this is not supported. ' +
              'Be sure to await previous act() calls before making a new one. ',
          );
        }
      }
    }

    const result = batchedUpdates(callback);
    if (
      result !== null &&
      typeof result === 'object' &&
      typeof result.then === 'function'
    ) {
      // setup a boolean that gets set to true only
      // once this act() call is await-ed
      let called = false;
      if (__DEV__) {
        if (typeof Promise !== 'undefined') {
          //eslint-disable-next-line no-undef
          Promise.resolve()
            .then(() => {})
            .then(() => {
              if (called === false) {
                warningWithoutStack(
                  null,
                  'You called act(async () => ...) without await. ' +
                    'This could lead to unexpected testing behaviour, interleaving multiple act ' +
                    'calls and mixing their scopes. You should - await act(async () => ...);',
                );
              }
            });
        }
      }

      // in the async case, the returned thenable runs the callback, flushes
      // effects and  microtasks in a loop until flushPassiveEffects() === false,
      // and cleans up
      return {
        then(resolve: () => void, reject: (?Error) => void) {
          called = true;
          result.then(
            () => {
              flushEffectsAndMicroTasks((err: ?Error) => {
                onDone();
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            },
            err => {
              onDone();
              reject(err);
            },
          );
        },
      };
    } else {
      if (__DEV__) {
        warningWithoutStack(
          result === undefined,
          'The callback passed to act(...) function ' +
            'must return undefined, or a Promise. You returned %s',
          result,
        );
      }

      // flush effects until none remain, and cleanup
      try {
        while (flushPassiveEffects()) {}
        onDone();
      } catch (err) {
        onDone();
        throw err;
      }

      // in the sync case, the returned thenable only warns *if* await-ed
      return {
        then(resolve: () => void) {
          if (__DEV__) {
            warningWithoutStack(
              false,
              'Do not await the result of calling act(...) with sync logic, it is not a Promise.',
            );
          }
          resolve();
        },
      };
    }
  }

  // end act() implementation

  function childToJSX(child, text) {
    if (text !== null) {
      return text;
    }
    if (child === null) {
      return null;
    }
    if (typeof child === 'string') {
      return child;
    }
    if (Array.isArray(child)) {
      if (child.length === 0) {
        return null;
      }
      if (child.length === 1) {
        return childToJSX(child[0], null);
      }
      // $FlowFixMe
      const children = child.map(c => childToJSX(c, null));
      if (children.every(c => typeof c === 'string' || typeof c === 'number')) {
        return children.join('');
      }
      return children;
    }
    if (Array.isArray(child.children)) {
      // This is an instance.
      const instance: Instance = (child: any);
      const children = childToJSX(instance.children, instance.text);
      const props = ({prop: instance.prop}: any);
      if (instance.hidden) {
        props.hidden = true;
      }
      if (children !== null) {
        props.children = children;
      }
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: instance.type,
        key: null,
        ref: null,
        props: props,
        _owner: null,
        _store: __DEV__ ? {} : undefined,
      };
    }
    // This is a text instance
    const textInstance: TextInstance = (child: any);
    if (textInstance.hidden) {
      return '';
    }
    return textInstance.text;
  }

  const ReactNoop = {
    _Scheduler: Scheduler,

    getChildren(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      if (container) {
        return container.children;
      } else {
        return null;
      }
    },

    getPendingChildren(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      if (container) {
        return container.pendingChildren;
      } else {
        return null;
      }
    },

    getOrCreateRootContainer(
      rootID: string = DEFAULT_ROOT_ID,
      isConcurrent: boolean = false,
    ) {
      let root = roots.get(rootID);
      if (!root) {
        const container = {rootID: rootID, pendingChildren: [], children: []};
        rootContainers.set(rootID, container);
        root = NoopRenderer.createContainer(container, isConcurrent, false);
        roots.set(rootID, root);
      }
      return root.current.stateNode.containerInfo;
    },

    getChildrenAsJSX(rootID: string = DEFAULT_ROOT_ID) {
      const children = childToJSX(ReactNoop.getChildren(rootID), null);
      if (children === null) {
        return null;
      }
      if (Array.isArray(children)) {
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type: REACT_FRAGMENT_TYPE,
          key: null,
          ref: null,
          props: {children},
          _owner: null,
          _store: __DEV__ ? {} : undefined,
        };
      }
      return children;
    },

    getPendingChildrenAsJSX(rootID: string = DEFAULT_ROOT_ID) {
      const children = childToJSX(ReactNoop.getPendingChildren(rootID), null);
      if (children === null) {
        return null;
      }
      if (Array.isArray(children)) {
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type: REACT_FRAGMENT_TYPE,
          key: null,
          ref: null,
          props: {children},
          _owner: null,
          _store: __DEV__ ? {} : undefined,
        };
      }
      return children;
    },

    createPortal(
      children: ReactNodeList,
      container: Container,
      key: ?string = null,
    ) {
      return createPortal(children, container, null, key);
    },

    // Shortcut for testing a single root
    render(element: React$Element<any>, callback: ?Function) {
      ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
    },

    renderLegacySyncRoot(element: React$Element<any>, callback: ?Function) {
      const rootID = DEFAULT_ROOT_ID;
      const isConcurrent = false;
      const container = ReactNoop.getOrCreateRootContainer(
        rootID,
        isConcurrent,
      );
      const root = roots.get(container.rootID);
      NoopRenderer.updateContainer(element, root, null, callback);
    },

    renderToRootWithID(
      element: React$Element<any>,
      rootID: string,
      callback: ?Function,
    ) {
      const isConcurrent = true;
      const container = ReactNoop.getOrCreateRootContainer(
        rootID,
        isConcurrent,
      );
      const root = roots.get(container.rootID);
      NoopRenderer.updateContainer(element, root, null, callback);
    },

    unmountRootWithID(rootID: string) {
      const root = roots.get(rootID);
      if (root) {
        NoopRenderer.updateContainer(null, root, null, () => {
          roots.delete(rootID);
          rootContainers.delete(rootID);
        });
      }
    },

    findInstance(
      componentOrElement: Element | ?React$Component<any, any>,
    ): null | Instance | TextInstance {
      if (componentOrElement == null) {
        return null;
      }
      // Unsound duck typing.
      const component = (componentOrElement: any);
      if (typeof component.id === 'number') {
        return component;
      }
      if (__DEV__) {
        return NoopRenderer.findHostInstanceWithWarning(
          component,
          'findInstance',
        );
      }
      return NoopRenderer.findHostInstance(component);
    },

    flushNextYield(): Array<mixed> {
      Scheduler.unstable_flushNumberOfYields(1);
      return Scheduler.unstable_clearYields();
    },

    flushWithHostCounters(
      fn: () => void,
    ):
      | {|
          hostDiffCounter: number,
          hostUpdateCounter: number,
        |}
      | {|
          hostDiffCounter: number,
          hostCloneCounter: number,
        |} {
      hostDiffCounter = 0;
      hostUpdateCounter = 0;
      hostCloneCounter = 0;
      try {
        Scheduler.flushAll();
        return useMutation
          ? {
              hostDiffCounter,
              hostUpdateCounter,
            }
          : {
              hostDiffCounter,
              hostCloneCounter,
            };
      } finally {
        hostDiffCounter = 0;
        hostUpdateCounter = 0;
        hostCloneCounter = 0;
      }
    },

    expire: Scheduler.advanceTime,

    flushExpired(): Array<mixed> {
      return Scheduler.unstable_flushExpired();
    },

    batchedUpdates: NoopRenderer.batchedUpdates,

    deferredUpdates: NoopRenderer.deferredUpdates,

    unbatchedUpdates: NoopRenderer.unbatchedUpdates,

    interactiveUpdates: NoopRenderer.interactiveUpdates,

    flushSync(fn: () => mixed) {
      NoopRenderer.flushSync(fn);
    },

    flushPassiveEffects: NoopRenderer.flushPassiveEffects,

    act,

    // Logs the current state of the tree.
    dumpTree(rootID: string = DEFAULT_ROOT_ID) {
      const root = roots.get(rootID);
      const rootContainer = rootContainers.get(rootID);
      if (!root || !rootContainer) {
        console.log('Nothing rendered yet.');
        return;
      }

      let bufferedLog = [];
      function log(...args) {
        bufferedLog.push(...args, '\n');
      }

      function logHostInstances(
        children: Array<Instance | TextInstance>,
        depth,
      ) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const indent = '  '.repeat(depth);
          if (typeof child.text === 'string') {
            log(indent + '- ' + child.text);
          } else {
            // $FlowFixMe - The child should've been refined now.
            log(indent + '- ' + child.type + '#' + child.id);
            // $FlowFixMe - The child should've been refined now.
            logHostInstances(child.children, depth + 1);
          }
        }
      }
      function logContainer(container: Container, depth) {
        log('  '.repeat(depth) + '- [root#' + container.rootID + ']');
        logHostInstances(container.children, depth + 1);
      }

      function logUpdateQueue(updateQueue: UpdateQueue<mixed>, depth) {
        log('  '.repeat(depth + 1) + 'QUEUED UPDATES');
        const firstUpdate = updateQueue.firstUpdate;
        if (!firstUpdate) {
          return;
        }

        log(
          '  '.repeat(depth + 1) + '~',
          '[' + firstUpdate.expirationTime + ']',
        );
        while (firstUpdate.next) {
          log(
            '  '.repeat(depth + 1) + '~',
            '[' + firstUpdate.expirationTime + ']',
          );
        }
      }

      function logFiber(fiber: Fiber, depth) {
        log(
          '  '.repeat(depth) +
            '- ' +
            // need to explicitly coerce Symbol to a string
            (fiber.type ? fiber.type.name || fiber.type.toString() : '[root]'),
          '[' +
            fiber.childExpirationTime +
            (fiber.pendingProps ? '*' : '') +
            ']',
        );
        if (fiber.updateQueue) {
          logUpdateQueue(fiber.updateQueue, depth);
        }
        // const childInProgress = fiber.progressedChild;
        // if (childInProgress && childInProgress !== fiber.child) {
        //   log(
        //     '  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.pendingWorkPriority,
        //   );
        //   logFiber(childInProgress, depth + 1);
        //   if (fiber.child) {
        //     log('  '.repeat(depth + 1) + 'CURRENT');
        //   }
        // } else if (fiber.child && fiber.updateQueue) {
        //   log('  '.repeat(depth + 1) + 'CHILDREN');
        // }
        if (fiber.child) {
          logFiber(fiber.child, depth + 1);
        }
        if (fiber.sibling) {
          logFiber(fiber.sibling, depth);
        }
      }

      log('HOST INSTANCES:');
      logContainer(rootContainer, 0);
      log('FIBERS:');
      logFiber(root.current, 0);

      console.log(...bufferedLog);
    },

    flushWithoutCommitting(
      expectedFlush: Array<mixed>,
      rootID: string = DEFAULT_ROOT_ID,
    ) {
      const root: any = roots.get(rootID);
      const expiration = NoopRenderer.computeUniqueAsyncExpiration();
      const batch = {
        _defer: true,
        _expirationTime: expiration,
        _onComplete: () => {
          root.firstBatch = null;
        },
        _next: null,
      };
      root.firstBatch = batch;
      Scheduler.unstable_flushWithoutYielding();
      const actual = Scheduler.unstable_clearYields();
      expect(actual).toEqual(expectedFlush);
      return (expectedCommit: Array<mixed>) => {
        batch._defer = false;
        NoopRenderer.flushRoot(root, expiration);
        expect(Scheduler.unstable_clearYields()).toEqual(expectedCommit);
      };
    },

    getRoot(rootID: string = DEFAULT_ROOT_ID) {
      return roots.get(rootID);
    },
  };

  return ReactNoop;
}

export default createReactNoop;
