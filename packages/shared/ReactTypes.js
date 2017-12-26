/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule ReactTypes
 */

export type ReactNode =
  | React$Element<any>
  | ReactCall<any>
  | ReactReturn<any>
  | ReactPortal
  | ReactText
  | ReactFragment;

export type ReactFragment = ReactEmpty | Iterable<React$Node>;

export type ReactNodeList = ReactEmpty | React$Node;

export type ReactText = string | number;

export type ReactEmpty = null | void | boolean;

export type ReactCall<V> = {
  $$typeof: Symbol | number,
  type: Symbol | number,
  key: null | string,
  ref: null,
  props: {
    props: any,
    // This should be a more specific CallHandler
    handler: (props: any, returns: Array<V>) => ReactNodeList,
    children?: ReactNodeList,
  },
};

export type ReactReturn<V> = {
  $$typeof: Symbol | number,
  type: Symbol | number,
  key: null,
  ref: null,
  props: {
    value: V,
  },
};

export type ReactPortal = {
  $$typeof: Symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};
