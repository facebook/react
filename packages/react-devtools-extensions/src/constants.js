/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import {
  CHROME_WEBSTORE_EXTENSION_ID,
  INTERNAL_EXTENSION_ID,
  LOCAL_EXTENSION_ID,
} from 'react-devtools-shared/src/constants';

declare var chrome: any;

export const CURRENT_EXTENSION_ID = chrome.runtime.id;

export const EXTENSION_INSTALL_CHECK = 'extension-install-check';
export const SHOW_DUPLICATE_EXTENSION_WARNING =
  'show-duplicate-extension-warning';

export const EXTENSION_INSTALLATION_TYPE:
  | 'public'
  | 'internal'
  | 'local'
  | 'unknown' =
  CURRENT_EXTENSION_ID === CHROME_WEBSTORE_EXTENSION_ID
    ? 'public'
    : CURRENT_EXTENSION_ID === INTERNAL_EXTENSION_ID
    ? 'internal'
    : CURRENT_EXTENSION_ID === LOCAL_EXTENSION_ID
    ? 'local'
    : 'unknown';
