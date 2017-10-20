/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactGenericBatching = require('ReactGenericBatching');
const ReactVersion = require('ReactVersion');

const {injectInternals} = require('ReactFiberDevToolsHook');

import type {ReactNativeCSType} from 'ReactNativeCSTypes';

const ReactFiberReconciler = require('react-reconciler');

const emptyObject = require('fbjs/lib/emptyObject');

export type Container = number;
export type Instance = number;
export type Props = Object;
export type TextInstance = number;

function processProps(instance: number, props: Props): Object {
  const propsPayload = {};
  for (var key in props) {
    if (key === 'children') {
      // Skip special case.
      continue;
    }
    var value = props[key];
    if (typeof value === 'function') {
      value = {
        style: 'rt-event',
        event: key,
        tag: instance,
      };
    }
    propsPayload[key] = value;
  }
  return propsPayload;
}

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

const ReactNativeCSFiberRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {},

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): Instance {
    return 0;
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: {},
    internalInstanceHandle: Object,
  ): TextInstance {
    return 0;
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

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit(): void {},

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: {},
  ): null | Object {
    if (arePropsEqual(oldProps, newProps)) {
      return null;
    }
    return processProps(instance, newProps);
  },

  resetAfterCommit(): void {},

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  scheduleDeferredCallback: global.requestIdleCallback,

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
      updatePayload: null | Object,
      type: string,
      oldProps: Props,
      newProps: Props,
      internalInstanceHandle: Object,
      keepChildren: boolean,
      recyclableInstance: null | Instance,
    ): Instance {
      return 0;
    },

    createContainerChildSet(
      container: Container,
    ): Array<Instance | TextInstance> {
      return [];
    },

    appendChildToContainerChildSet(
      childSet: Array<Instance | TextInstance>,
      child: Instance | TextInstance,
    ): void {},

    finalizeContainerChildren(
      container: Container,
      newChildren: Array<Instance | TextInstance>,
    ): void {},

    replaceContainerChildren(
      container: Container,
      newChildren: Array<Instance | TextInstance>,
    ): void {},
  },
});

const roots = new Map();

const ReactNativeCSFiber: ReactNativeCSType = {
  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactNativeCSFiberRenderer.createContainer(containerTag, false);
      roots.set(containerTag, root);
    }
    ReactNativeCSFiberRenderer.updateContainer(element, root, null, callback);

    return ReactNativeCSFiberRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag: number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      ReactNativeCSFiberRenderer.updateContainer(null, root, null, () => {
        roots.delete(containerTag);
      });
    }
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  flushSync: ReactNativeCSFiberRenderer.flushSync,
};

injectInternals({
  findHostInstanceByFiber: ReactNativeCSFiberRenderer.findHostInstance,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-cs-renderer',
});

module.exports = ReactNativeCSFiber;
