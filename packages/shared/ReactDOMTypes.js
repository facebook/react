/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactFundamentalComponentInstance,
  ReactEventResponder,
  ReactEventResponderInstance,
  EventPriority,
} from 'shared/ReactTypes';

type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | Touch;

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
  responderTarget: null | Element | Document,
  target: Element | Document,
  type: string,
};

export type ReactDOMEventResponder = ReactEventResponder<
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
>;

export type ReactDOMEventResponderInstance = ReactEventResponderInstance<
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
>;

export type ReactDOMFundamentalComponentInstance = ReactFundamentalComponentInstance<
  any,
  any,
>;

export type ReactDOMResponderContext = {
  dispatchEvent: (
    eventProp: string,
    eventValue: any,
    eventPriority: EventPriority,
  ) => void,
  isTargetWithinNode: (
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ) => boolean,
  isTargetWithinResponder: (Element | Document) => boolean,
  isTargetWithinResponderScope: (Element | Document) => boolean,
  addRootEventTypes: (rootEventTypes: Array<string>) => void,
  removeRootEventTypes: (rootEventTypes: Array<string>) => void,
  hasOwnership: () => boolean,
  requestGlobalOwnership: () => boolean,
  releaseOwnership: () => boolean,
  setTimeout: (func: () => void, timeout: number) => number,
  clearTimeout: (timerId: number) => void,
  getFocusableElementsInScope(deep: boolean): Array<HTMLElement>,
  getActiveDocument(): Document,
  objectAssign: Function,
  getTimeStamp: () => number,
  isTargetWithinHostComponent: (
    target: Element | Document,
    elementType: string,
  ) => boolean,
  // Used for controller components
  enqueueStateRestore(Element | Document): void,
};
