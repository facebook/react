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

const UNRECOGNIZED_EXTENSION_WARNING =
  'React Developer Tools: You are running an unrecognized installation of the React Developer Tools extension, which might conflict with other versions of the extension installed in your browser. ' +
  'Please make sure you only have a single version of the extension installed or enabled. ' +
  'If you are developing this extension locally, make sure to build the extension using the `yarn build:<browser>:local` command.';

export function checkForDuplicateInstallations(callback: boolean => void) {
  switch (EXTENSION_INSTALLATION_TYPE) {
    case 'public': {
      // If this is the public extension (e.g. from Chrome Web Store), check if an internal
      // or local build of the extension is also installed, and if so, disable this extension.
      // TODO show warning if other installations are present.
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
      // is also installed, and if so, disable this extension.
      // If the public version of the extension is also installed, that extension
      // will disable itself.
      // TODO show warning if other installations are present.
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
        // always keep this one enabled. Other installations disable themselves if
        // they detect the local build is installed.
        callback(false);
        break;
      }

      // If this extension wasn't built locally during development, we can't reliably
      // detect if there are other installations of DevTools present.
      // In this case, assume there are no duplicate exensions and show a warning about
      // potential conflicts.
      console.error(UNRECOGNIZED_EXTENSION_WARNING);
      chrome.devtools.inspectedWindow.eval(
        `console.error("${UNRECOGNIZED_EXTENSION_WARNING}")`,
      );
      callback(false);
      break;
    }
    case 'unknown': {
      // If we don't know how this extension was built, we can't reliably detect if there
      // are other installations of DevTools present.
      // In this case, assume there are no duplicate exensions and show a warning about
      // potential conflicts.
      console.error(UNRECOGNIZED_EXTENSION_WARNING);
      chrome.devtools.inspectedWindow.eval(
        `console.error("${UNRECOGNIZED_EXTENSION_WARNING}")`,
      );
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
