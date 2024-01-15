/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  createElement as createElementProd,
  createFactory as createFactoryProd,
  cloneElement as cloneElementProd,
} from './ReactElementProd';

import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';

export {isValidElement, cloneAndReplaceKey} from './ReactElementProd';

export const createElement: any = __DEV__
  ? createElementWithValidation
  : createElementProd;
export const cloneElement: any = __DEV__
  ? cloneElementWithValidation
  : cloneElementProd;
export const createFactory: any = __DEV__
  ? createFactoryWithValidation
  : createFactoryProd;
