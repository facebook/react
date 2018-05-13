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

export function getPublicInstance(inst: Instance | TextInstance): * {
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

export function appendChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }
  parentInstance.children.push(child);
}

export function insertBefore(
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

export function removeChild(
  parentInstance: Instance | Container,
  child: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  parentInstance.children.splice(index, 1);
}

export function getRootHostContext() {
    return emptyObject;
  }

  export function getChildHostContext() {
    return emptyObject;
  }

  export function prepareForCommit(): void {
    // noop
  }

  export function resetAfterCommit(): void {
    // noop
  }

  export function createInstance(
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
  }

  export function appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
  }

  export function finalizeInitialChildren(
    testElement: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    return false;
  }

  export function prepareUpdate(
    testElement: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: Object,
  ): null | {} {
    return UPDATE_SIGNAL;
  }

  export function shouldSetTextContent(type: string, props: Props): boolean {
    return false;
  }

  export function shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  }

  export function createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
  ): TextInstance {
    return {
      text,
      tag: 'TEXT',
    };
  }

  export const scheduleDeferredCallback = TestRendererScheduling.scheduleDeferredCallback;
  export const cancelDeferredCallback = TestRendererScheduling.cancelDeferredCallback;
  // This approach enables `now` to be mocked by tests,
  // Even after the reconciler has initialized and read host config values.
  export const now = () => TestRendererScheduling.nowImplementation();

  export const isPrimaryRenderer = true;
  export const supportsMutation = true;
  export const supportsPersistence = false;
  export const supportsHydration = false;

    export function commitUpdate(
      instance: Instance,
      updatePayload: {},
      type: string,
      oldProps: Props,
      newProps: Props,
      internalInstanceHandle: Object,
    ): void {
      instance.type = type;
      instance.props = newProps;
    }

    export function commitMount(
      instance: Instance,
      type: string,
      newProps: Props,
      internalInstanceHandle: Object,
    ): void {
      // noop
    }

    export function commitTextUpdate(
      textInstance: TextInstance,
      oldText: string,
      newText: string,
    ): void {
      textInstance.text = newText;
    }

    export function resetTextContent(testElement: Instance): void {
      // noop
    }

    export const appendChildToContainer = appendChild;
    export const insertInContainerBefore = insertBefore;
    export const removeChildFromContainer = removeChild;


export function cloneInstance() {
  // not supported
}

export function createContainerChildSet() {
  // not supported
}

export function appendChildToContainerChildSet() {
  // not supported
}

export function finalizeContainerChildren() {
  // not supported
}

export function replaceContainerChildren() {
  // not supported
}


export function canHydrateInstance() {
  // not supported
}

export function canHydrateTextInstance() {
  // not supported
}

export function getNextHydratableSibling() {
  // not supported
}

export function getFirstHydratableChild() {
  // not supported
}

export function hydrateInstance() {
  // not supported
}

export function hydrateTextInstance() {
  // not supported
}

export function didNotMatchHydratedContainerTextInstance() {
  // not supported
}

export function didNotMatchHydratedTextInstance() {
  // not supported
}

export function didNotHydrateContainerInstance() {
  // not supported
}

export function didNotHydrateInstance() {
  // not supported
}

export function didNotFindHydratableContainerInstance() {
  // not supported
}

export function didNotFindHydratableContainerTextInstance() {
  // not supported
}

export function didNotFindHydratableInstance() {
  // not supported
}

export function didNotFindHydratableTextInstance() {
  // not supported
}
