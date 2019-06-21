/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';

type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | Touch;

export type ReactDOMEventResponderEventType =
  | string
  | {name: string, passive?: boolean};

export type PointerType =
  | ''
  | 'mouse'
  | 'keyboard'
  | 'pen'
  | 'touch'
  | 'trackpad';

export type ReactDOMResponderEvent = {
  nativeEvent: AnyNativeEvent,
  passive: boolean,
  passiveSupported: boolean,
  pointerId: null | number,
  pointerType: PointerType,
  target: Element | Document,
  type: string,
};

export type ReactDOMEventResponder = {
  displayName: string,
  targetEventTypes?: Array<ReactDOMEventResponderEventType>,
  rootEventTypes?: Array<ReactDOMEventResponderEventType>,
  createInitialState?: (props: null | Object) => Object,
  allowMultipleHostChildren: boolean,
  allowEventHooks: boolean,
  onEvent?: (
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onEventCapture?: (
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onRootEvent?: (
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onMount?: (
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onUnmount?: (
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onOwnershipChange?: (
    context: ReactDOMResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
};

export type ReactDOMResponderContext = {
  dispatchEvent: (
    eventObject: Object,
    listener: (Object) => void,
    eventPriority: EventPriority,
  ) => void,
  isTargetWithinElement: (
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ) => boolean,
  isTargetWithinEventComponent: (Element | Document) => boolean,
  isTargetWithinEventResponderScope: (Element | Document) => boolean,
  isEventWithinTouchHitTarget: (event: ReactDOMResponderEvent) => boolean,
  addRootEventTypes: (
    rootEventTypes: Array<ReactDOMEventResponderEventType>,
  ) => void,
  removeRootEventTypes: (
    rootEventTypes: Array<ReactDOMEventResponderEventType>,
  ) => void,
  hasOwnership: () => boolean,
  requestGlobalOwnership: () => boolean,
  releaseOwnership: () => boolean,
  setTimeout: (func: () => void, timeout: number) => number,
  clearTimeout: (timerId: number) => void,
  getFocusableElementsInScope(): Array<HTMLElement>,
  getActiveDocument(): Document,
  objectAssign: Function,
  getEventCurrentTarget(event: ReactDOMResponderEvent): Element,
  getTimeStamp: () => number,
  isTargetWithinHostComponent: (
    target: Element | Document,
    elementType: string,
    deep: boolean,
  ) => boolean,
  continueLocalPropagation(): void,
};
