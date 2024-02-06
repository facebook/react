/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  $$typeof: symbol | number,
  type: ReactProviderType<T>,
  key: null | string,
  ref: null,
  props: {
    value: T,
    children?: ReactNodeList,
  },
};

export type ReactProviderType<T> = {
  $$typeof: symbol | number,
  _context: ReactContext<T>,
};

export type ReactConsumer<T> = {
  $$typeof: symbol | number,
  type: ReactContext<T>,
  key: null | string,
  ref: null,
  props: {
    children: (value: T) => ReactNodeList,
  },
};

export type ReactContext<T> = {
  $$typeof: symbol | number,
  Consumer: ReactContext<T>,
  Provider: ReactProviderType<T>,
  _currentValue: T,
  _currentValue2: T,
  _threadCount: number,
  // DEV only
  _currentRenderer?: Object | null,
  _currentRenderer2?: Object | null,
  // This value may be added by application code
  // to improve DEV tooling display names
  displayName?: string,
};

export type ReactPortal = {
  $$typeof: symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};

export type RefObject = {
  current: any,
};

export type ReactScope = {
  $$typeof: symbol | number,
};

export type ReactScopeQuery = (
  type: string,
  props: {[string]: mixed},
  instance: mixed,
) => boolean;

export type ReactScopeInstance = {
  DO_NOT_USE_queryAllNodes(ReactScopeQuery): null | Array<Object>,
  DO_NOT_USE_queryFirstNode(ReactScopeQuery): null | Object,
  containsNode(Object): boolean,
  getChildContextValues: <T>(context: ReactContext<T>) => Array<T>,
};

// The subset of a Thenable required by things thrown by Suspense.
// This doesn't require a value to be passed to either handler.
export interface Wakeable {
  then(onFulfill: () => mixed, onReject: () => mixed): void | Wakeable;
}

// The subset of a Promise that React APIs rely on. This resolves a value.
// This doesn't require a return value neither from the handler nor the
// then function.
interface ThenableImpl<T> {
  then(
    onFulfill: (value: T) => mixed,
    onReject: (error: mixed) => mixed,
  ): void | Wakeable;
}
interface UntrackedThenable<T> extends ThenableImpl<T> {
  status?: void;
}

export interface PendingThenable<T> extends ThenableImpl<T> {
  status: 'pending';
}

export interface FulfilledThenable<T> extends ThenableImpl<T> {
  status: 'fulfilled';
  value: T;
}

export interface RejectedThenable<T> extends ThenableImpl<T> {
  status: 'rejected';
  reason: mixed;
}

export type Thenable<T> =
  | UntrackedThenable<T>
  | PendingThenable<T>
  | FulfilledThenable<T>
  | RejectedThenable<T>;

export type OffscreenMode =
  | 'hidden'
  | 'unstable-defer-without-hiding'
  | 'visible'
  | 'manual';

export type StartTransitionOptions = {
  name?: string,
};

export type Usable<T> = Thenable<T> | ReactContext<T>;

export type ReactCustomFormAction = {
  name?: string,
  action?: string,
  encType?: string,
  method?: string,
  target?: string,
  data?: null | FormData,
};

// This is an opaque type returned by decodeFormState on the server, but it's
// defined in this shared file because the same type is used by React on
// the client.
export type ReactFormState<S, ReferenceId> = [
  S /* actual state value */,
  string /* key path */,
  ReferenceId /* Server Reference ID */,
  number /* number of bound arguments */,
];

export type Awaited<T> = T extends null | void
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends Object // `await` only unwraps object types with a callable then. Non-object types are not unwrapped.
  ? T extends {then(onfulfilled: infer F): any} // thenable, extracts the first argument to `then()`
    ? F extends (value: infer V) => any // if the argument to `then` is callable, extracts the argument
      ? Awaited<V> // recursively unwrap the value
      : empty // the argument to `then` was not callable.
    : T // argument was not an object
  : T; // non-thenable
