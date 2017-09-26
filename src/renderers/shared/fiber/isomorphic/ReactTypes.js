/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTypes
 * @flow
 */

'use strict';

import type {ReactCoroutine, ReactYield} from 'ReactCoroutine';

export type ReactNode =
  | ReactElement<any>
  | ReactCoroutine
  | ReactYield
  | ReactText
  | ReactFragment;

export type ReactFragment = ReactEmpty | Iterable<ReactNode>;

export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactText = string | number;

export type ReactEmpty = null | void | boolean;
