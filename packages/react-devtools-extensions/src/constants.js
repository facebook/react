/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

declare var chrome: any;

export const CURRENT_EXTENSION_ID = chrome.runtime.id;

export const EXTENSION_INSTALL_CHECK_MESSAGE = 'extension-install-check';

export const CHROME_WEBSTORE_EXTENSION_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
export const INTERNAL_EXTENSION_ID = 'dnjnjgbfilfphmojnmhliehogmojhclc';
export const LOCAL_EXTENSION_ID = 'ikiahnapldjmdmpkmfhjdjilojjhgcbf';

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
