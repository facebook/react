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
  | ReactConsumer<any>;

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
    ...
  },
  ...
};

export type ReactProviderType<T> = {
  $$typeof: Symbol | number,
  _context: ReactContext<T>,
  ...
};

export type ReactConsumer<T> = {
  $$typeof: Symbol | number,
  type: ReactContext<T>,
  key: null | string,
  ref: null,
  props: {
    children: (value: T) => ReactNodeList,
    unstable_observedBits?: number,
    ...
  },
  ...
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
  ...
};

export type ReactPortal = {
  $$typeof: Symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
  ...
};

export type RefObject = {|
  current: any,
|};

export type ReactEventResponderInstance<E, C> = {|
  fiber: Object,
  props: Object,
  responder: ReactEventResponder<E, C>,
  rootEventTypes: null | Set<string>,
  state: Object,
|};

export type ReactEventResponderListener<E, C> = {|
  props: Object,
  responder: ReactEventResponder<E, C>,
|};

export type ReactEventResponder<E, C> = {
  $$typeof: Symbol | number,
  displayName: string,
  targetEventTypes: null | Array<string>,
  targetPortalPropagation: boolean,
  rootEventTypes: null | Array<string>,
  getInitialState: null | ((props: Object) => Object),
  onEvent:
    | null
    | ((event: E, context: C, props: Object, state: Object) => void),
  onRootEvent:
    | null
    | ((event: E, context: C, props: Object, state: Object) => void),
  onMount: null | ((context: C, props: Object, state: Object) => void),
  onUnmount: null | ((context: C, props: Object, state: Object) => void),
  ...
};

export type EventPriority = 0 | 1 | 2;

export const DiscreteEvent: EventPriority = 0;
export const UserBlockingEvent: EventPriority = 1;
export const ContinuousEvent: EventPriority = 2;

export type ReactFundamentalComponentInstance<C, H> = {|
  currentFiber: mixed,
  instance: mixed,
  prevProps: null | Object,
  props: Object,
  impl: ReactFundamentalImpl<C, H>,
  state: Object,
|};

export type ReactFundamentalImpl<C, H> = {
  displayName: string,
  reconcileChildren: boolean,
  getInitialState?: (props: Object) => Object,
  getInstance: (context: C, props: Object, state: Object) => H,
  getServerSideString?: (context: C, props: Object) => string,
  getServerSideStringClose?: (context: C, props: Object) => string,
  onMount: (context: C, instance: mixed, props: Object, state: Object) => void,
  shouldUpdate?: (
    context: C,
    prevProps: null | Object,
    nextProps: Object,
    state: Object,
  ) => boolean,
  onUpdate?: (
    context: C,
    instance: mixed,
    prevProps: null | Object,
    nextProps: Object,
    state: Object,
  ) => void,
  onUnmount?: (
    context: C,
    instance: mixed,
    props: Object,
    state: Object,
  ) => void,
  onHydrate?: (context: C, props: Object, state: Object) => boolean,
  onFocus?: (context: C, props: Object, state: Object) => boolean,
  ...
};

export type ReactFundamentalComponent<C, H> = {|
  $$typeof: Symbol | number,
  impl: ReactFundamentalImpl<C, H>,
|};

export type ReactScope = {|
  $$typeof: Symbol | number,
|};

export type ReactScopeQuery = (
  type: string,
  props: {[string]: mixed, ...},
  instance: mixed,
) => boolean;

export type ReactScopeMethods = {|
  DO_NOT_USE_queryAllNodes(ReactScopeQuery): null | Array<Object>,
  DO_NOT_USE_queryFirstNode(ReactScopeQuery): null | Object,
  containsNode(Object): boolean,
  getChildContextValues: <T>(context: ReactContext<T>) => Array<T>,
|};

export type ReactScopeInstance = {|
  fiber: Object,
  methods: null | ReactScopeMethods,
|};
