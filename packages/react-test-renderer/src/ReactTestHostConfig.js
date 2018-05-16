/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import emptyObject from 'fbjs/lib/emptyObject';

import * as TestRendererScheduling from './ReactTestRendererScheduling';

export type Instance = {|
  type: string,
  props: Object,
  children: Array<Instance | TextInstance>,
  rootContainerInstance: Container,
  tag: 'INSTANCE',
|};

export type TextInstance = {|
  text: string,
  tag: 'TEXT',
|};

type Container = {|
  children: Array<Instance | TextInstance>,
  createNodeMock: Function,
  tag: 'CONTAINER',
|};

type Props = Object;

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

const ReactTestHostConfig = {
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

  getPublicInstance,

  scheduleDeferredCallback: TestRendererScheduling.scheduleDeferredCallback,
  cancelDeferredCallback: TestRendererScheduling.cancelDeferredCallback,
  // This approach enables `now` to be mocked by tests,
  // Even after the reconciler has initialized and read host config values.
  now: () => TestRendererScheduling.nowImplementation(),

  isPrimaryRenderer: true,

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
};

export default ReactTestHostConfig;
