/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ReactNode =
  | React$Element<any>
  | ReactPortal
  | ReactText
  | ReactFragment
  | ReactProvider<any>
  | ReactConsumer<any>
  | ReactEventComponent
  | ReactEventTarget;

export type ReactEmpty = null | void | boolean;

export type ReactFragment = ReactEmpty | Iterable<React$Node>;

export type ReactNodeList = ReactEmpty | React$Node;

export type ReactText = string | number;

export type ReactProvider<T> = {
  $$typeof: Symbol | number,
  type: ReactProviderType<T>,
  key: null | string,
  ref: null,
  props: {
    value: T,
    children?: ReactNodeList,
  },
};

export type ReactProviderType<T> = {
  $$typeof: Symbol | number,
  _context: ReactContext<T>,
};

export type ReactConsumer<T> = {
  $$typeof: Symbol | number,
  type: ReactContext<T>,
  key: null | string,
  ref: null,
  props: {
    children: (value: T) => ReactNodeList,
    unstable_observedBits?: number,
  },
};

export type ReactContext<T> = {
  $$typeof: Symbol | number,
  Consumer: ReactContext<T>,
  Provider: ReactProviderType<T>,

  _calculateChangedBits: ((a: T, b: T) => number) | null,

  _currentValue: T,
  _currentValue2: T,
  _threadCount: number,

  // DEV only
  _currentRenderer?: Object | null,
  _currentRenderer2?: Object | null,
};

export type ReactPortal = {
  $$typeof: Symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};

export type RefObject = {|
  current: any,
|};

export type ReactEventResponderEventType =
  | string
  | {name: string, passive?: boolean, capture?: boolean};

export type ReactEventResponder = {
  targetEventTypes?: Array<ReactEventResponderEventType>,
  rootEventTypes?: Array<ReactEventResponderEventType>,
  createInitialState?: (props: null | Object) => Object,
  stopLocalPropagation: boolean,
  onEvent?: (
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onEventCapture?: (
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onRootEvent?: (
    event: ReactResponderEvent,
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onMount?: (
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onUnmount?: (
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onOwnershipChange?: (
    context: ReactResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
};

export type ReactEventComponentInstance = {|
  props: null | Object,
  responder: ReactEventResponder,
  rootEventTypes: null | Set<string>,
  rootInstance: mixed,
  state: null | Object,
|};

export type ReactEventComponent = {|
  $$typeof: Symbol | number,
  displayName?: string,
  props: null | Object,
  responder: ReactEventResponder,
|};

export type ReactEventTarget = {|
  $$typeof: Symbol | number,
  displayName?: string,
  type: Symbol | number,
|};

type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | Touch;

export type ReactResponderEvent = {
  nativeEvent: AnyNativeEvent,
  target: Element | Document,
  type: string,
  passive: boolean,
  passiveSupported: boolean,
};

export type ReactResponderDispatchEventOptions = {
  discrete?: boolean,
};

export type ReactResponderContext = {
  dispatchEvent: (
    eventObject: Object,
    listener: (Object) => void,
    otpions: ReactResponderDispatchEventOptions,
  ) => void,
  isTargetWithinElement: (
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ) => boolean,
  isTargetWithinEventComponent: (Element | Document) => boolean,
  isPositionWithinTouchHitTarget: (
    doc: Document,
    x: number,
    y: number,
  ) => boolean,
  addRootEventTypes: (
    document: Document,
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  removeRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  hasOwnership: () => boolean,
  requestOwnership: () => boolean,
  releaseOwnership: () => boolean,
  setTimeout: (func: () => void, timeout: number) => Symbol,
  clearTimeout: (timerId: Symbol) => void,
  getEventTargetsFromTarget: (
    target: Element | Document,
    queryType?: Symbol | number,
    queryKey?: string,
  ) => Array<{
    node: Element,
    props: null | Object,
  }>,
};
