/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {ReactNodeList} from 'shared/ReactTypes';
import type {ReactNativeCSType} from './ReactNativeCSTypes';

// Provided by CS:
import {CSStatefulComponent} from 'CSStatefulComponent';

import ReactFiberReconciler from 'react-reconciler';
import {injectInternals} from 'react-reconciler/src/ReactFiberDevToolsHook';
import ReactVersion from 'shared/ReactVersion';

const emptyObject = {};

type Container = {
  pendingChild: null | Instance | TextInstance,
};
type InstanceProps = Props & {children: Array<Instance>};
type Instance = {
  props: InstanceProps,
  options: {key: string, ref: null},
  data: {type: 'NATIVE', name: string},
};
type Props = Object;
type TextInstance = Instance;

// We currently don't actually return a new state. We only use state updaters to trigger a
// rerender. Therefore our state updater is the identity functions. When we later deal
// with sync scheduling and aborted renders, we will need to update the state in render.
const identityUpdater = state => state;
// We currently don't have a hook for aborting render. Will add one once it is in place
// in React Native proper.
const infiniteDeadline = {
  timeRemaining: function() {
    return Infinity;
  },
};

const arePropsEqual = (oldProps: Props, newProps: Props): boolean => {
  var key;
  for (key in newProps) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    if (newProps[key] !== oldProps[key]) {
      return false;
    }
  }
  for (key in oldProps) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    if (!(key in newProps)) {
      return false;
    }
  }
  return true;
};

// React doesn't expose its full keypath. To manage lifetime of instances, we instead use IDs.
let nextComponentKey = 0;

// Callback. Currently this is global. TODO: This should be per root.
let scheduledCallback = null;
// Updater. This is the CS updater we use to trigger the update. TODO: This should be per root.
let scheduleUpdate = null;

const ReactNativeCSFiberRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    if (parentInstance.props) {
      parentInstance.props.children.push(child);
    } else {
      // CSCustom
      (parentInstance: any).children.push(child);
    }
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): Instance {
    let key = '' + nextComponentKey++;
    let ref = null; // TODO: Always create Ref object so that getPublicInstance can use it.
    // We need a new props object so that we can represent flattened children.
    let newProps = Object.assign({}, props);
    newProps.children = [];
    if (type === 'CSCustom') {
      // Special cased type that treats the props as the object.
      // Useful for custom children types like FlexItem.
      return newProps;
    }
    return {
      props: newProps,
      options: {key, ref},
      data: {type: 'NATIVE', name: type},
    };
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): TextInstance {
    // Could auto-translate to CSText with some host context defined attributes.
    throw new Error('Not yet implemented.');
  },

  finalizeInitialChildren(
    parentInstance: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    return false;
  },

  getRootHostContext(): {} {
    return emptyObject;
  },

  getChildHostContext(): {} {
    return emptyObject;
  },

  getPublicInstance(instance: Instance) {
    return instance.options.ref;
  },

  prepareForCommit(): void {},

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: {},
  ): null | InstanceProps {
    if (arePropsEqual(oldProps, newProps)) {
      return null;
    }
    return Object.assign({}, newProps);
  },

  resetAfterCommit(): void {},

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  scheduleDeferredCallback(callback) {
    scheduledCallback = callback;
    if (scheduleUpdate !== null) {
      scheduleUpdate(identityUpdater);
    }
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    // TODO: Figure out when we should allow text content.
    return false;
  },

  useSyncScheduling: false,

  now(): number {
    // TODO: Enable expiration by implementing this method.
    return 0;
  },

  persistence: {
    cloneInstance(
      instance: Instance,
      updatePayload: null | InstanceProps,
      type: string,
      oldProps: Props,
      newProps: Props,
      internalInstanceHandle: Object,
      keepChildren: boolean,
      recyclableInstance: null | Instance,
    ): Instance {
      let newInstanceProps = updatePayload;
      if (newInstanceProps === null) {
        newInstanceProps = Object.assign({}, newProps);
      }
      // We need a new props object so that we can represent flattened children.
      newInstanceProps.children = keepChildren ? instance.props.children : [];
      if (type === 'CSCustom') {
        return newInstanceProps;
      }
      return {
        props: newInstanceProps,
        options: instance.options,
        data: instance.data,
      };
    },

    createContainerChildSet(container: Container): Container {
      // We'll only ever have one instance in the container.
      container.pendingChild = null;
      return container;
    },

    appendChildToContainerChildSet(
      childSet: Container,
      child: Instance | TextInstance,
    ): void {
      if (childSet.pendingChild !== null) {
        throw new Error(
          'CSReact does not support top level fragments. Wrap it in a primitve.',
        );
      }
      childSet.pendingChild = child;
    },

    finalizeContainerChildren(
      container: Container,
      newChildren: Container,
    ): void {},

    replaceContainerChildren(
      container: Container,
      newChildren: Container,
    ): void {},
  },
});

injectInternals({
  findHostInstanceByFiber: ReactNativeCSFiberRenderer.findHostInstance,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-cs-renderer',
});

type ReactCSProps = {children: ReactNodeList};
type ReactCSState = {
  root: Object,
  container: {
    pendingChild: null | Instance | TextInstance,
  },
};

const ReactCS = CSStatefulComponent({
  getInitialState({props}: {props: ReactCSProps}): ReactCSState {
    let container = {
      pendingChild: null,
    };
    let root = ReactNativeCSFiberRenderer.createContainer(container, false);
    return {root, container};
  },
  render({
    props,
    state,
    stateUpdater,
  }: {
    props: ReactCSProps,
    state: ReactCSState,
    stateUpdater: (update: (oldState: ReactCSState) => ReactCSState) => void,
  }) {
    scheduleUpdate = stateUpdater;
    // TODO: For a props rerender updateContainer will schedule an additional state
    // update even though it is not necessary since we're already rendering.
    // We should only call scheduleUpdate for a React setState, not a top level
    // props update.
    ReactNativeCSFiberRenderer.updateContainer(
      props.children,
      state.root,
      null,
      null,
    );
    if (scheduledCallback) {
      const callback = scheduledCallback;
      scheduledCallback = null;
      callback(infiniteDeadline);
    }
    return state.container.pendingChild;
  },
  getInstance({state}: {state: ReactCSState}) {
    return ReactNativeCSFiberRenderer.getPublicRootInstance(state.root);
  },
  // TODO: Unmount hook. E.g. finalizer.
});

export default (ReactCS: ReactNativeCSType);
