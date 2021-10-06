/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

declare var chrome: any;

export const CHROME_WEBSTORE_EXTENSION_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
export const CURRENT_EXTENSION_ID = chrome.runtime.id;
export const IS_CHROME_WEBSTORE_EXTENSION =
  CURRENT_EXTENSION_ID === CHROME_WEBSTORE_EXTENSION_ID;
export const EXTENSION_INSTALL_CHECK_MESSAGE = 'extension-install-check';
