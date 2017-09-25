/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTypes
 * @flow
 */

'use strict';

export type ReactNode =
  | React$Element<any>
  | ReactCoroutine
  | ReactYield
  | ReactPortal
  | ReactText
  | ReactFragment;

export type ReactFragment = ReactEmpty | Iterable<React$Node>;

export type ReactNodeList = ReactEmpty | React$Node;

export type ReactText = string | number;

export type ReactEmpty = null | void | boolean;

export type ReactCoroutine = {
  $$typeof: Symbol | number,
  key: null | string,
  children: any,
  // This should be a more specific CoroutineHandler
  handler: (props: any, yields: Array<mixed>) => ReactNodeList,
  props: any,
};

export type ReactYield = {
  $$typeof: Symbol | number,
  value: mixed,
};

export type ReactPortal = {
  $$typeof: Symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};
