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

import type {
  Fiber,
  TransitionTracingCallbacks,
} from 'react-reconciler/src/ReactInternalTypes';
import type {UpdateQueue} from 'react-reconciler/src/ReactUpdateQueue';
import type {ReactNodeList, OffscreenMode} from 'shared/ReactTypes';
import type {RootTag} from 'react-reconciler/src/ReactRootTags';

import * as Scheduler from 'scheduler/unstable_mock';
import {REACT_FRAGMENT_TYPE, REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import {checkPropStringCoercion} from 'shared/CheckStringCoercion';
import {
  DefaultEventPriority,
  IdleEventPriority,
  ConcurrentRoot,
  LegacyRoot,
} from 'react-reconciler/constants';

type Container = {
  rootID: string,
  children: Array<Instance | TextInstance>,
  pendingChildren: Array<Instance | TextInstance>,
  ...
};
type Props = {
  prop: any,
  hidden: boolean,
  children?: mixed,
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  ...
};
type Instance = {|
  type: string,
  id: number,
  parent: number,
  children: Array<Instance | TextInstance>,
  text: string | null,
  prop: any,
  hidden: boolean,
  context: HostContext,
|};
type TextInstance = {|
  text: string,
  id: number,
  parent: number,
  hidden: boolean,
  context: HostContext,
|};
type HostContext = Object;
type CreateRootOptions = {
  transitionCallbacks?: TransitionTracingCallbacks,
  ...
};

const NO_CONTEXT = {};
const UPPERCASE_CONTEXT = {};
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
    const prevParent = child.parent;
    if (prevParent !== -1 && prevParent !== parentInstance.id) {
      throw new Error('Reparenting is not allowed');
    }
    child.parent = parentInstance.id;
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

  function clearContainer(container: Container): void {
    container.children.splice(0);
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
    if (__DEV__) {
      checkPropStringCoercion(newProps.children, 'children');
    }
    const clone = {
      id: instance.id,
      type: type,
      parent: instance.parent,
      children: keepChildren ? instance.children : [],
      text: shouldSetTextContent(type, newProps)
        ? computeText((newProps.children: any) + '', instance.context)
        : null,
      prop: newProps.prop,
      hidden: !!newProps.hidden,
      context: instance.context,
    };
    Object.defineProperty(clone, 'id', {
      value: clone.id,
      enumerable: false,
    });
    Object.defineProperty(clone, 'parent', {
      value: clone.parent,
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
      if (type === 'offscreen') {
        return parentHostContext;
      }
      if (type === 'uppercase') {
        return UPPERCASE_CONTEXT;
      }
      return NO_CONTEXT;
    },

    getPublicInstance(instance) {
      return instance;
    },

    createInstance(
      type: string,
      props: Props,
      rootContainerInstance: Container,
      hostContext: HostContext,
      internalInstanceHandle: Object,
    ): Instance {
      if (type === 'errorInCompletePhase') {
        throw new Error('Error in host config.');
      }
      if (__DEV__) {
        // The `if` statement here prevents auto-disabling of the safe coercion
        // ESLint rule, so we must manually disable it below.
        if (shouldSetTextContent(type, props)) {
          checkPropStringCoercion(props.children, 'children');
        }
      }
      const inst = {
        id: instanceCounter++,
        type: type,
        children: [],
        parent: -1,
        text: shouldSetTextContent(type, props)
          ? // eslint-disable-next-line react-internal/safe-string-coercion
            computeText((props.children: any) + '', hostContext)
          : null,
        prop: props.prop,
        hidden: !!props.hidden,
        context: hostContext,
      };
      // Hide from unit tests
      Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
      Object.defineProperty(inst, 'parent', {
        value: inst.parent,
        enumerable: false,
      });
      Object.defineProperty(inst, 'text', {
        value: inst.text,
        enumerable: false,
      });
      Object.defineProperty(inst, 'context', {
        value: inst.context,
        enumerable: false,
      });
      Object.defineProperty(inst, 'fiber', {
        value: internalInstanceHandle,
        enumerable: false,
      });
      return inst;
    },

    appendInitialChild(
      parentInstance: Instance,
      child: Instance | TextInstance,
    ): void {
      const prevParent = child.parent;
      if (prevParent !== -1 && prevParent !== parentInstance.id) {
        throw new Error('Reparenting is not allowed');
      }
      child.parent = parentInstance.id;
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
    ): null | {...} {
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

    createTextInstance(
      text: string,
      rootContainerInstance: Container,
      hostContext: Object,
      internalInstanceHandle: Object,
    ): TextInstance {
      if (hostContext === UPPERCASE_CONTEXT) {
        text = text.toUpperCase();
      }
      const inst = {
        text: text,
        id: instanceCounter++,
        parent: -1,
        hidden: false,
        context: hostContext,
      };
      // Hide from unit tests
      Object.defineProperty(inst, 'id', {value: inst.id, enumerable: false});
      Object.defineProperty(inst, 'parent', {
        value: inst.parent,
        enumerable: false,
      });
      Object.defineProperty(inst, 'context', {
        value: inst.context,
        enumerable: false,
      });
      return inst;
    },

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,

    supportsMicrotasks: true,
    scheduleMicrotask:
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : typeof Promise !== 'undefined'
        ? callback =>
            Promise.resolve(null)
              .then(callback)
              .catch(error => {
                setTimeout(() => {
                  throw error;
                });
              })
        : setTimeout,

    prepareForCommit(): null | Object {
      return null;
    },

    resetAfterCommit(): void {},

    getCurrentEventPriority() {
      return currentEventPriority;
    },

    now: Scheduler.unstable_now,

    isPrimaryRenderer: true,
    warnsIfNotActing: true,
    supportsHydration: false,

    getInstanceFromNode() {
      throw new Error('Not yet implemented.');
    },

    beforeActiveInstanceBlur() {
      // NO-OP
    },

    afterActiveInstanceBlur() {
      // NO-OP
    },

    preparePortalMount() {
      // NO-OP
    },

    prepareScopeUpdate() {},

    getInstanceFromScope() {
      throw new Error('Not yet implemented.');
    },

    detachDeletedInstance() {},

    logRecoverableError() {
      // no-op
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
          instance.hidden = !!newProps.hidden;
          if (shouldSetTextContent(type, newProps)) {
            if (__DEV__) {
              checkPropStringCoercion(newProps.children, 'children');
            }
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
        clearContainer,

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
        clearContainer,

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
          if (
            newChildren.length === 1 &&
            newChildren[0].text === 'Error when completing root'
          ) {
            // Trigger an error for testing purposes
            throw Error('Error when completing root');
          }
        },

        replaceContainerChildren(
          container: Container,
          newChildren: Array<Instance | TextInstance>,
        ): void {
          container.children = newChildren;
        },

        getOffscreenContainerType(): string {
          return 'offscreen';
        },

        getOffscreenContainerProps(
          mode: OffscreenMode,
          children: ReactNodeList,
        ): Props {
          return {
            hidden: mode === 'hidden',
            children,
          };
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
            id: instance.id,
            parent: instance.parent,
            hidden: true,
            context: instance.context,
          };
          // Hide from unit tests
          Object.defineProperty(clone, 'id', {
            value: clone.id,
            enumerable: false,
          });
          Object.defineProperty(clone, 'parent', {
            value: clone.parent,
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

  let currentEventPriority = DefaultEventPriority;

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
    if (isArray(child)) {
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
    if (isArray(child.children)) {
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

  function getChildren(root) {
    if (root) {
      return useMutation
        ? root.children
        : removeOffscreenContainersFromChildren(root.children, false);
    } else {
      return null;
    }
  }

  function getPendingChildren(root) {
    if (root) {
      return useMutation
        ? root.children
        : removeOffscreenContainersFromChildren(root.pendingChildren, false);
    } else {
      return null;
    }
  }

  function removeOffscreenContainersFromChildren(children, hideNearestNode) {
    // Mutation mode and persistent mode have different outputs for Offscreen
    // and Suspense trees. Persistent mode adds an additional host node wrapper,
    // whereas mutation mode does not.
    //
    // This function removes the offscreen host wrappers so that the output is
    // consistent. If the offscreen node is hidden, it transfers the hiddenness
    // to the child nodes, to mimic how it works in mutation mode. That way our
    // tests don't have to fork tree assertions.
    //
    // So, it takes a tree that looks like this:
    //
    //    <offscreen hidden={true}>
    //      <span>A</span>
    //      <span>B</span>
    //    </offscren>
    //
    // And turns it into this:
    //
    //   <span hidden={true}>A</span>
    //   <span hidden={true}>B</span>
    //
    // We don't mutate the original tree, but instead return a copy.
    //
    // This function is only used by our test assertions, via the `getChildren`
    // and `getChildrenAsJSX` methods.
    let didClone = false;
    const newChildren = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const innerChildren = child.children;
      if (innerChildren !== undefined) {
        // This is a host instance instance
        const instance: Instance = (child: any);
        if (instance.type === 'offscreen') {
          // This is an offscreen wrapper instance. Remove it from the tree
          // and recursively return its children, as if it were a fragment.
          didClone = true;
          if (instance.text !== null) {
            // If this offscreen tree contains only text, we replace it with
            // a text child. Related to `shouldReplaceTextContent` feature.
            const offscreenTextInstance: TextInstance = {
              text: instance.text,
              id: instanceCounter++,
              parent: instance.parent,
              hidden: hideNearestNode || instance.hidden,
              context: instance.context,
            };
            // Hide from unit tests
            Object.defineProperty(offscreenTextInstance, 'id', {
              value: offscreenTextInstance.id,
              enumerable: false,
            });
            Object.defineProperty(offscreenTextInstance, 'parent', {
              value: offscreenTextInstance.parent,
              enumerable: false,
            });
            Object.defineProperty(offscreenTextInstance, 'context', {
              value: offscreenTextInstance.context,
              enumerable: false,
            });
            newChildren.push(offscreenTextInstance);
          } else {
            // Skip the offscreen node and replace it with its children
            const offscreenChildren = removeOffscreenContainersFromChildren(
              innerChildren,
              hideNearestNode || instance.hidden,
            );
            newChildren.push.apply(newChildren, offscreenChildren);
          }
        } else {
          // This is a regular (non-offscreen) instance. If the nearest
          // offscreen boundary is hidden, hide this node.
          const hidden = hideNearestNode ? true : instance.hidden;
          const clonedChildren = removeOffscreenContainersFromChildren(
            instance.children,
            // We never need to hide the children of this node, since if we're
            // inside a hidden tree, then the hidden style will be applied to
            // this node.
            false,
          );
          if (
            clonedChildren === instance.children &&
            hidden === instance.hidden
          ) {
            // No changes. Reuse the original instance without cloning.
            newChildren.push(instance);
          } else {
            didClone = true;
            const clone: Instance = {
              id: instance.id,
              type: instance.type,
              parent: instance.parent,
              children: clonedChildren,
              text: instance.text,
              prop: instance.prop,
              hidden: hideNearestNode ? true : instance.hidden,
              context: instance.context,
            };
            Object.defineProperty(clone, 'id', {
              value: clone.id,
              enumerable: false,
            });
            Object.defineProperty(clone, 'parent', {
              value: clone.parent,
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
            newChildren.push(clone);
          }
        }
      } else {
        // This is a text instance
        const textInstance: TextInstance = (child: any);
        if (hideNearestNode) {
          didClone = true;
          const clone = {
            text: textInstance.text,
            id: textInstance.id,
            parent: textInstance.parent,
            hidden: textInstance.hidden || hideNearestNode,
            context: textInstance.context,
          };
          Object.defineProperty(clone, 'id', {
            value: clone.id,
            enumerable: false,
          });
          Object.defineProperty(clone, 'parent', {
            value: clone.parent,
            enumerable: false,
          });
          Object.defineProperty(clone, 'context', {
            value: clone.context,
            enumerable: false,
          });

          newChildren.push(clone);
        } else {
          newChildren.push(textInstance);
        }
      }
    }
    // There are some tests that assume reference equality, so preserve it
    // when possible. Alternatively, we could update the tests to compare the
    // ids instead.
    return didClone ? newChildren : children;
  }

  function getChildrenAsJSX(root) {
    const children = childToJSX(getChildren(root), null);
    if (children === null) {
      return null;
    }
    if (isArray(children)) {
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
  }

  function getPendingChildrenAsJSX(root) {
    const children = childToJSX(getChildren(root), null);
    if (children === null) {
      return null;
    }
    if (isArray(children)) {
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
  }

  function flushSync<R>(fn: () => R): R {
    if (__DEV__) {
      if (NoopRenderer.isAlreadyRendering()) {
        console.error(
          'flushSync was called from inside a lifecycle method. React cannot ' +
            'flush when React is already rendering. Consider moving this call to ' +
            'a scheduler task or micro task.',
        );
      }
    }
    return NoopRenderer.flushSync(fn);
  }

  function onRecoverableError(error) {
    // TODO: Turn this on once tests are fixed
    // eslint-disable-next-line react-internal/no-production-logging, react-internal/warning-args
    // console.error(error);
  }

  let idCounter = 0;

  const ReactNoop = {
    _Scheduler: Scheduler,

    getChildren(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      return getChildren(container);
    },

    getPendingChildren(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      return getPendingChildren(container);
    },

    getOrCreateRootContainer(rootID: string = DEFAULT_ROOT_ID, tag: RootTag) {
      let root = roots.get(rootID);
      if (!root) {
        const container = {rootID: rootID, pendingChildren: [], children: []};
        rootContainers.set(rootID, container);
        root = NoopRenderer.createContainer(
          container,
          tag,
          false,
          null,
          null,
          false,
          '',
          onRecoverableError,
        );
        roots.set(rootID, root);
      }
      return root.current.stateNode.containerInfo;
    },

    // TODO: Replace ReactNoop.render with createRoot + root.render
    createRoot(options?: CreateRootOptions) {
      const container = {
        rootID: '' + idCounter++,
        pendingChildren: [],
        children: [],
      };
      const fiberRoot = NoopRenderer.createContainer(
        container,
        ConcurrentRoot,
        false,
        null,
        null,
        false,
        '',
        onRecoverableError,
        options && options.transitionCallbacks
          ? options.transitionCallbacks
          : null,
      );
      return {
        _Scheduler: Scheduler,
        render(children: ReactNodeList) {
          NoopRenderer.updateContainer(children, fiberRoot, null, null);
        },
        getChildren() {
          return getChildren(container);
        },
        getChildrenAsJSX() {
          return getChildrenAsJSX(container);
        },
      };
    },

    createLegacyRoot() {
      const container = {
        rootID: '' + idCounter++,
        pendingChildren: [],
        children: [],
      };
      const fiberRoot = NoopRenderer.createContainer(
        container,
        LegacyRoot,
        false,
        null,
        null,
        false,
        '',
        onRecoverableError,
      );
      return {
        _Scheduler: Scheduler,
        render(children: ReactNodeList) {
          NoopRenderer.updateContainer(children, fiberRoot, null, null);
        },
        getChildren() {
          return getChildren(container);
        },
        getChildrenAsJSX() {
          return getChildrenAsJSX(container);
        },
      };
    },

    getChildrenAsJSX(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      return getChildrenAsJSX(container);
    },

    getPendingChildrenAsJSX(rootID: string = DEFAULT_ROOT_ID) {
      const container = rootContainers.get(rootID);
      return getPendingChildrenAsJSX(container);
    },

    createPortal(
      children: ReactNodeList,
      container: Container,
      key: ?string = null,
    ) {
      return NoopRenderer.createPortal(children, container, null, key);
    },

    // Shortcut for testing a single root
    render(element: React$Element<any>, callback: ?Function) {
      ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
    },

    renderLegacySyncRoot(element: React$Element<any>, callback: ?Function) {
      const rootID = DEFAULT_ROOT_ID;
      const container = ReactNoop.getOrCreateRootContainer(rootID, LegacyRoot);
      const root = roots.get(container.rootID);
      NoopRenderer.updateContainer(element, root, null, callback);
    },

    renderToRootWithID(
      element: React$Element<any>,
      rootID: string,
      callback: ?Function,
    ) {
      const container = ReactNoop.getOrCreateRootContainer(
        rootID,
        ConcurrentRoot,
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
        Scheduler.unstable_flushAll();
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

    expire: Scheduler.unstable_advanceTime,

    flushExpired(): Array<mixed> {
      return Scheduler.unstable_flushExpired();
    },

    unstable_runWithPriority: NoopRenderer.runWithPriority,

    batchedUpdates: NoopRenderer.batchedUpdates,

    deferredUpdates: NoopRenderer.deferredUpdates,

    discreteUpdates: NoopRenderer.discreteUpdates,

    idleUpdates<T>(fn: () => T): T {
      const prevEventPriority = currentEventPriority;
      currentEventPriority = IdleEventPriority;
      try {
        fn();
      } finally {
        currentEventPriority = prevEventPriority;
      }
    },

    flushSync,
    flushPassiveEffects: NoopRenderer.flushPassiveEffects,

    // Logs the current state of the tree.
    dumpTree(rootID: string = DEFAULT_ROOT_ID) {
      const root = roots.get(rootID);
      const rootContainer = rootContainers.get(rootID);
      if (!root || !rootContainer) {
        // eslint-disable-next-line react-internal/no-production-logging
        console.log('Nothing rendered yet.');
        return;
      }

      const bufferedLog = [];
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
        const first = updateQueue.firstBaseUpdate;
        const update = first;
        if (update !== null) {
          do {
            log(
              '  '.repeat(depth + 1) + '~',
              '[' + update.expirationTime + ']',
            );
          } while (update !== null);
        }

        const lastPending = updateQueue.shared.pending;
        if (lastPending !== null) {
          const firstPending = lastPending.next;
          const pendingUpdate = firstPending;
          if (pendingUpdate !== null) {
            do {
              log(
                '  '.repeat(depth + 1) + '~',
                '[' + pendingUpdate.expirationTime + ']',
              );
            } while (pendingUpdate !== null && pendingUpdate !== firstPending);
          }
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

      // eslint-disable-next-line react-internal/no-production-logging
      console.log(...bufferedLog);
    },

    getRoot(rootID: string = DEFAULT_ROOT_ID) {
      return roots.get(rootID);
    },
  };

  return ReactNoop;
}

export default createReactNoop;
