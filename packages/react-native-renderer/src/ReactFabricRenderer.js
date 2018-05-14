/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethodsMixinType,
  ReactNativeBaseComponentViewConfig,
} from './ReactNativeTypes';

import {mountSafeCallback, warnForStyleProps} from './NativeMethodsMixinUtils';
import * as ReactNativeAttributePayload from './ReactNativeAttributePayload';
import * as ReactNativeFrameScheduling from './ReactNativeFrameScheduling';
import * as ReactNativeViewConfigRegistry from 'ReactNativeViewConfigRegistry';
import ReactFiberReconciler from 'react-reconciler';

import deepFreezeAndThrowOnMutationInDev from 'deepFreezeAndThrowOnMutationInDev';
import invariant from 'fbjs/lib/invariant';

// Modules provided by RN:
import TextInputState from 'TextInputState';
import FabricUIManager from 'FabricUIManager';
import UIManager from 'UIManager';

// Counter for uniquely identifying views.
// % 10 === 1 means it is a rootTag.
// % 2 === 0 means it is a Fabric tag.
// This means that they never overlap.
let nextReactTag = 2;

type HostContext = $ReadOnly<{|
  isInAParentText: boolean,
|}>;

/**
 * This is used for refs on host components.
 */
class ReactFabricHostComponent {
  _nativeTag: number;
  viewConfig: ReactNativeBaseComponentViewConfig;
  currentProps: Props;

  constructor(
    tag: number,
    viewConfig: ReactNativeBaseComponentViewConfig,
    props: Props,
  ) {
    this._nativeTag = tag;
    this.viewConfig = viewConfig;
    this.currentProps = props;
  }

  blur() {
    TextInputState.blurTextInput(this._nativeTag);
  }

  focus() {
    TextInputState.focusTextInput(this._nativeTag);
  }

  measure(callback: MeasureOnSuccessCallback) {
    UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback(this, callback),
    );
  }

  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ) {
    UIManager.measureLayout(
      this._nativeTag,
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess),
    );
  }

  setNativeProps(nativeProps: Object) {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    const updatePayload = ReactNativeAttributePayload.create(
      nativeProps,
      this.viewConfig.validAttributes,
    );

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        this._nativeTag,
        this.viewConfig.uiViewClassName,
        updatePayload,
      );
    }
  }
}

// eslint-disable-next-line no-unused-expressions
(ReactFabricHostComponent.prototype: NativeMethodsMixinType);

type Node = Object;
type ChildSet = Object;
type Container = number;
type Instance = {
  node: Node,
  canonical: ReactFabricHostComponent,
};
type Props = Object;
type TextInstance = {
  node: Node,
};

const ReactFabricRenderer = ReactFiberReconciler({
  appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    FabricUIManager.appendChild(parentInstance.node, child.node);
  },

  createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: HostContext,
    internalInstanceHandle: Object,
  ): Instance {
    const tag = nextReactTag;
    nextReactTag += 2;

    const viewConfig = ReactNativeViewConfigRegistry.get(type);

    if (__DEV__) {
      for (const key in viewConfig.validAttributes) {
        if (props.hasOwnProperty(key)) {
          deepFreezeAndThrowOnMutationInDev(props[key]);
        }
      }
    }

    invariant(
      type !== 'RCTView' || !hostContext.isInAParentText,
      'Nesting of <View> within <Text> is not currently supported.',
    );

    const updatePayload = ReactNativeAttributePayload.create(
      props,
      viewConfig.validAttributes,
    );

    const node = FabricUIManager.createNode(
      tag, // reactTag
      viewConfig.uiViewClassName, // viewName
      rootContainerInstance, // rootTag
      updatePayload, // props
      internalInstanceHandle, // internalInstanceHandle
    );

    const component = new ReactFabricHostComponent(tag, viewConfig, props);

    return {
      node: node,
      canonical: component,
    };
  },

  createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: HostContext,
    internalInstanceHandle: Object,
  ): TextInstance {
    invariant(
      hostContext.isInAParentText,
      'Text strings must be rendered within a <Text> component.',
    );

    const tag = nextReactTag;
    nextReactTag += 2;

    const node = FabricUIManager.createNode(
      tag, // reactTag
      'RCTRawText', // viewName
      rootContainerInstance, // rootTag
      {text: text}, // props
      internalInstanceHandle, // instance handle
    );

    return {
      node: node,
    };
  },

  finalizeInitialChildren(
    parentInstance: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
  ): boolean {
    return false;
  },

  getRootHostContext(rootContainerInstance: Container): HostContext {
    return {isInAParentText: false};
  },

  getChildHostContext(
    parentHostContext: HostContext,
    type: string,
  ): HostContext {
    const prevIsInAParentText = parentHostContext.isInAParentText;
    const isInAParentText =
      type === 'AndroidTextInput' || // Android
      type === 'RCTMultilineTextInputView' || // iOS
      type === 'RCTSinglelineTextInputView' || // iOS
      type === 'RCTText' ||
      type === 'RCTVirtualText';

    if (prevIsInAParentText !== isInAParentText) {
      return {isInAParentText};
    } else {
      return parentHostContext;
    }
  },

  getPublicInstance(instance) {
    return instance.canonical;
  },

  now: ReactNativeFrameScheduling.now,

  // The Fabric renderer is secondary to the existing React Native renderer.
  isPrimaryRenderer: false,

  prepareForCommit(): void {
    // Noop
  },

  prepareUpdate(
    instance: Instance,
    type: string,
    oldProps: Props,
    newProps: Props,
    rootContainerInstance: Container,
    hostContext: HostContext,
  ): null | Object {
    const viewConfig = instance.canonical.viewConfig;
    const updatePayload = ReactNativeAttributePayload.diff(
      oldProps,
      newProps,
      viewConfig.validAttributes,
    );
    // TODO: If the event handlers have changed, we need to update the current props
    // in the commit phase but there is no host config hook to do it yet.
    return updatePayload;
  },

  resetAfterCommit(): void {
    // Noop
  },

  scheduleDeferredCallback: ReactNativeFrameScheduling.scheduleDeferredCallback,
  cancelDeferredCallback: ReactNativeFrameScheduling.cancelDeferredCallback,

  shouldDeprioritizeSubtree(type: string, props: Props): boolean {
    return false;
  },

  shouldSetTextContent(type: string, props: Props): boolean {
    // TODO (bvaughn) Revisit this decision.
    // Always returning false simplifies the createInstance() implementation,
    // But creates an additional child Fiber for raw text children.
    // No additional native views are created though.
    // It's not clear to me which is better so I'm deferring for now.
    // More context @ github.com/facebook/react/pull/8560#discussion_r92111303
    return false;
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
      const node = instance.node;
      let clone;
      if (keepChildren) {
        if (updatePayload !== null) {
          clone = FabricUIManager.cloneNodeWithNewProps(node, updatePayload);
        } else {
          clone = FabricUIManager.cloneNode(node);
        }
      } else {
        if (updatePayload !== null) {
          clone = FabricUIManager.cloneNodeWithNewChildrenAndProps(
            node,
            updatePayload,
          );
        } else {
          clone = FabricUIManager.cloneNodeWithNewChildren(node);
        }
      }
      return {
        node: clone,
        canonical: instance.canonical,
      };
    },

    createContainerChildSet(container: Container): ChildSet {
      return FabricUIManager.createChildSet(container);
    },

    appendChildToContainerChildSet(
      childSet: ChildSet,
      child: Instance | TextInstance,
    ): void {
      FabricUIManager.appendChildToSet(childSet, child.node);
    },

    finalizeContainerChildren(
      container: Container,
      newChildren: ChildSet,
    ): void {
      FabricUIManager.completeRoot(container, newChildren);
    },

    replaceContainerChildren(
      container: Container,
      newChildren: ChildSet,
    ): void {},
  },
});

export default ReactFabricRenderer;
