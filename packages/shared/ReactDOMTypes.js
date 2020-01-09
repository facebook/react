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
  pointerType: PointerType,
  target: Element | Document,
  type: string,
  ...
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
    eventValue: any,
    listener: (any) => void,
    eventPriority: EventPriority,
  ) => void,
  isTargetWithinNode: (
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ) => boolean,
  isTargetWithinResponder: (null | Element | Document) => boolean,
  isTargetWithinResponderScope: (null | Element | Document) => boolean,
  addRootEventTypes: (rootEventTypes: Array<string>) => void,
  removeRootEventTypes: (rootEventTypes: Array<string>) => void,
  getActiveDocument(): Document,
  objectAssign: Function,
  getTimeStamp: () => number,
  isTargetWithinHostComponent: (
    target: Element | Document,
    elementType: string,
  ) => boolean,
  continuePropagation(): void,
  // Used for controller components
  enqueueStateRestore(Element | Document): void,
  getResponderNode(): Element | null,
  ...
};
