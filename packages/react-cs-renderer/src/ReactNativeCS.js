/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const {CSStatefulComponent} = require('CSStatefulComponent');
const ReactFiberReconciler = require('react-reconciler');
const ReactGenericBatching = require('events/ReactGenericBatching');
const ReactVersion = require('shared/ReactVersion');

const {
  injectInternals,
} = require('react-reconciler/src/ReactFiberDevToolsHook');

import type {ReactNodeList} from 'shared/ReactTypes';
import type {ReactNativeCSType} from './ReactNativeCSTypes';

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

function arePropsEqual(oldProps: Props, newProps: Props): boolean {
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
}

// React doesn't expose its full keypath. To manage lifetime of instances, we instead use IDs.
let nextComponentKey = 0;

// Callback. Currently this is global, but it should be per root.
let scheduledCallback = null;

const ReactNativeCSFiberRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance.props.children.push(child);
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
    return {
      props: newProps,
      options: {key, ref: null},
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
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    // TODO: Figure out when we should allow text content.
    return false;
  },

  useSyncScheduling: true,

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
  getInitialState({props: ReactCSProps}): ReactCSState {
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
    ReactNativeCSFiberRenderer.updateContainer(
      props.children,
      state.root,
      null,
      null,
    );
    return state.container.pendingChild;
  },
  getInstance({state}: {state: ReactCSState}) {
    return ReactNativeCSFiberRenderer.getPublicRootInstance(state.root);
  },
  // TODO: Unmount hook. E.g. finalizer.
});

module.exports = (ReactCS: ReactNativeCSType);
