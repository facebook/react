/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule ReactElementType
 */

'use strict';

import type {ReactInstance} from 'ReactInstanceType';

export type Source = {
  fileName: string,
  lineNumber: number,
};

export type ReactElement = {
  $$typeof: any,
  type: any,
  key: any,
  ref: any,
  props: any,
  _owner: ReactInstance,

  // __DEV__
  _store: {
    validated: boolean,
  },
  _self: ReactElement,
  _shadowChildren: any,
  _source: Source,
};
