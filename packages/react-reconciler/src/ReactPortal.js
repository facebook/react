/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_PORTAL_TYPE} from 'shared/ReactSymbols';
import {checkKeyStringCoercion} from 'shared/CheckStringCoercion';

import type {ReactNodeList, ReactPortal} from 'shared/ReactTypes';

/**
 * This function create the portal
 * @param {ReactNodeList} children element to create the portal
 * @param {any} containerInfo container of element create portal implementation
 * @param {any} implementation implementation of portal
 * @param {?string} key optional identifier
 * @returns {ReactPortal}
 */
export function createPortal(
  children: ReactNodeList,
  containerInfo: any,
  // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
  key: ?string = null,
): ReactPortal {
  if (__DEV__) {
    checkKeyStringCoercion(key);
  }
  return {
    // This tag allow us to uniquely identify this as a React Portal
    $$typeof: REACT_PORTAL_TYPE,
    key: !key ? null : key,
    children,
    containerInfo,
    implementation,
  };
}
