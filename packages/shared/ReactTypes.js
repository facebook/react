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
  | ReactEventComponent<any, any, any>;

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

export type ReactEventComponentInstance<T, E, C> = {|
  currentFiber: mixed,
  isHook: boolean,
  props: Object,
  responder: ReactEventResponder<T, E, C>,
  rootEventTypes: null | Set<string>,
  rootInstance: null | mixed,
  state: Object,
|};

export type ReactEventResponder<T, E, C> = {
  displayName: string,
  targetEventTypes?: Array<T>,
  rootEventTypes?: Array<T>,
  getInitialState?: (props: Object) => Object,
  allowMultipleHostChildren: boolean,
  allowEventHooks: boolean,
  onEvent?: (event: E, context: C, props: Object, state: Object) => void,
  onRootEvent?: (event: E, context: C, props: Object, state: Object) => void,
  onMount?: (context: C, props: Object, state: Object) => void,
  onUnmount?: (context: C, props: Object, state: Object) => void,
  onOwnershipChange?: (context: C, props: Object, state: Object) => void,
};

export type ReactEventComponent<T, E, C> = {|
  $$typeof: Symbol | number,
  responder: ReactEventResponder<T, E, C>,
|};

export opaque type EventPriority = 0 | 1 | 2;

export const DiscreteEvent: EventPriority = 0;
export const UserBlockingEvent: EventPriority = 1;
export const ContinuousEvent: EventPriority = 2;
