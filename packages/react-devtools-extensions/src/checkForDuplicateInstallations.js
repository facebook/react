/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

declare var chrome: any;

import {__DEBUG__} from 'react-devtools-shared/src/constants';
import {
  EXTENSION_INSTALL_CHECK_MESSAGE,
  EXTENSION_INSTALLATION_TYPE,
  INTERNAL_EXTENSION_ID,
  LOCAL_EXTENSION_ID,
} from './constants';

export function checkForDuplicateInstallations(callback: boolean => void) {
  switch (EXTENSION_INSTALLATION_TYPE) {
    case 'public': {
      // If this is the public extension (e.g. from Chrome Web Store), check if an internal
      // or local build of the extension is also installed, and if so, return true.
      checkForInstalledExtensions([
        INTERNAL_EXTENSION_ID,
        LOCAL_EXTENSION_ID,
      ]).then(areExtensionsInstalled => {
        if (areExtensionsInstalled.some(isInstalled => isInstalled)) {
          callback(true);
        } else {
          callback(false);
        }
      });
      break;
    }
    case 'internal': {
      // If this is the internal extension, check if a local build of the extension
      // is also installed, and if so, return true.
      checkForInstalledExtension(LOCAL_EXTENSION_ID).then(isInstalled => {
        if (isInstalled) {
          callback(true);
        } else {
          callback(false);
        }
      });
      break;
    }
    case 'local': {
      if (__DEV__) {
        // If this is the local extension (i.e. built locally during development),
        // return false
        callback(false);
        break;
      }

      // If this extension wasn't built locally during development, we can't reliably
      // detect if there are other installations of DevTools present.
      // In this case, assume there are no duplicate extensions
      callback(false);
      break;
    }
    case 'unknown': {
      // If we don't know how this extension was built, we can't reliably detect if there
      // are other installations of DevTools present.
      // In this case, assume there are no duplicate exensions
      callback(false);
      break;
    }
    default: {
      (EXTENSION_INSTALLATION_TYPE: empty);
    }
  }
}

function checkForInstalledExtensions(
  extensionIds: string[],
): Promise<boolean[]> {
  return Promise.all(
    extensionIds.map(extensionId => checkForInstalledExtension(extensionId)),
  );
}

function checkForInstalledExtension(extensionId: string): Promise<boolean> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      extensionId,
      EXTENSION_INSTALL_CHECK_MESSAGE,
      response => {
        if (__DEBUG__) {
          console.log(
            'checkForDuplicateInstallations: Duplicate installation check responded with',
            {
              response,
              error: chrome.runtime.lastError?.message,
              currentExtension: EXTENSION_INSTALLATION_TYPE,
              checkingExtension: extensionId,
            },
          );
        }
        if (chrome.runtime.lastError != null) {
          resolve(false);
        } else {
          resolve(true);
        }
      },
    );
  });
}
