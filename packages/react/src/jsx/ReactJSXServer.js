/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// These are implementations of the jsx APIs for React Server runtimes.
import {REACT_FRAGMENT_TYPE} from 'shared/ReactSymbols';
import {
  jsxWithValidationStatic,
  jsxWithValidationDynamic,
} from './ReactJSXElementValidator';
import {jsx as jsxProd} from './ReactJSXElement';
const jsx: any = __DEV__ ? jsxWithValidationDynamic : jsxProd;
// we may want to special case jsxs internally to take advantage of static children.
// for now we can ship identical prod functions
const jsxs: any = __DEV__ ? jsxWithValidationStatic : jsxProd;

export {REACT_FRAGMENT_TYPE as Fragment, jsx, jsxs};
