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
    ...
  },
  ...
};

export type ReactContext<T> = {
  $$typeof: Symbol | number,
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

export type ReactScope = {|
  $$typeof: Symbol | number,
|};

export type ReactScopeQuery = (
  type: string,
  props: {[string]: mixed, ...},
  instance: mixed,
) => boolean;

export type ReactScopeInstance = {|
  DO_NOT_USE_queryAllNodes(ReactScopeQuery): null | Array<Object>,
  DO_NOT_USE_queryFirstNode(ReactScopeQuery): null | Object,
  containsNode(Object): boolean,
  getChildContextValues: <T>(context: ReactContext<T>) => Array<T>,
|};

// Mutable source version can be anything (e.g. number, string, immutable data structure)
// so long as it changes every time any part of the source changes.
export type MutableSourceVersion = $NonMaybeType<mixed>;

export type MutableSourceGetSnapshotFn<
  Source: $NonMaybeType<mixed>,
  Snapshot,
> = (source: Source) => Snapshot;

export type MutableSourceSubscribeFn<Source: $NonMaybeType<mixed>, Snapshot> = (
  source: Source,
  callback: (snapshot: Snapshot) => void,
) => () => void;

export type MutableSourceGetVersionFn = (
  source: $NonMaybeType<mixed>,
) => MutableSourceVersion;

export type MutableSource<Source: $NonMaybeType<mixed>> = {|
  _source: Source,

  _getVersion: MutableSourceGetVersionFn,

  // Tracks the version of this source at the time it was most recently read.
  // Used to determine if a source is safe to read from before it has been subscribed to.
  // Version number is only used during mount,
  // since the mechanism for determining safety after subscription is expiration time.
  //
  // As a workaround to support multiple concurrent renderers,
  // we categorize some renderers as primary and others as secondary.
  // We only expect there to be two concurrent renderers at most:
  // React Native (primary) and Fabric (secondary);
  // React DOM (primary) and React ART (secondary).
  // Secondary renderers store their context values on separate fields.
  // We use the same approach for Context.
  _workInProgressVersionPrimary: null | MutableSourceVersion,
  _workInProgressVersionSecondary: null | MutableSourceVersion,

  // DEV only
  // Used to detect multiple renderers using the same mutable source.
  _currentPrimaryRenderer?: Object | null,
  _currentSecondaryRenderer?: Object | null,

  // DEV only
  // Used to detect side effects that update a mutable source during render.
  // See https://github.com/facebook/react/issues/19948
  _currentlyRenderingFiber?: Fiber | null,
  _initialVersionAsOfFirstRender?: MutableSourceVersion | null,
|};

// The subset of a Thenable required by things thrown by Suspense.
// This doesn't require a value to be passed to either handler.
export interface Wakeable {
  then(onFulfill: () => mixed, onReject: () => mixed): void | Wakeable;
}

// The subset of a Promise that React APIs rely on. This resolves a value.
// This doesn't require a return value neither from the handler nor the
// then function.
export interface Thenable<+R> {
  then<U>(
    onFulfill: (value: R) => void | Thenable<U> | U,
    onReject: (error: mixed) => void | Thenable<U> | U,
  ): void | Thenable<U>;
}

export type OffscreenMode =
  | 'hidden'
  | 'unstable-defer-without-hiding'
  | 'visible';
