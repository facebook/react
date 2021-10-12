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
  EXTENSION_NAME,
} from './constants';

export function checkForDuplicateInstallations(callback: boolean => void) {
  switch (EXTENSION_INSTALLATION_TYPE) {
    case 'chrome-web-store': {
      // If this is the Chrome Web Store extension, check if an internal build of the
      // extension is also installed, and if so, disable this extension.
      chrome.runtime.sendMessage(
        INTERNAL_EXTENSION_ID,
        EXTENSION_INSTALL_CHECK_MESSAGE,
        response => {
          if (__DEBUG__) {
            console.log(
              'checkForDuplicateInstallations: Duplicate installation check responded with',
              {
                response,
                error: chrome.runtime.lastError?.message,
                currentExtension: EXTENSION_INSTALLATION_TYPE,
              },
            );
          }
          if (chrome.runtime.lastError != null) {
            callback(false);
          } else {
            callback(response === true);
          }
        },
      );
      break;
    }
    case 'internal': {
      // If this is the internal extension, keep this one enabled.
      // Other installations disable themselves if they detect this installation.
      // TODO show warning if other installations are present.
      callback(false);
      break;
    }
    case 'unknown': {
      if (__DEV__) {
        // If this extension was built locally during development, then we check for other
        // installations of the extension via the `chrome.management` API (which is only
        // enabled in local development builds).
        // If we detect other installations, we disable this one and show a warning
        // for the developer to disable the other installations.
        // NOTE: Ideally in this case we would disable any other extensions except the
        // development one. However, since we don't have a stable extension ID for dev builds,
        // doing so would require for other installations to wait for a message from this extension,
        // which would unnecessarily delay initialization of those extensions.
        chrome.management.getAll(extensions => {
          if (chrome.runtime.lastError != null) {
            const errorMessage =
              'React Developer Tools: Unable to access `chrome.management` to check for duplicate extensions. This extension will be disabled.' +
              'If you are developing this extension locally, make sure to build the extension using the `yarn build:<browser>:dev` command.';
            console.error(errorMessage);
            chrome.devtools.inspectedWindow.eval(
              `console.error("${errorMessage}")`,
            );
            callback(true);
            return;
          }
          const devToolsExtensions = extensions.filter(
            extension => extension.name === EXTENSION_NAME && extension.enabled,
          );
          if (devToolsExtensions.length > 1) {
            // TODO: Show warning in UI of extension that remains enabled
            const errorMessage =
              'React Developer Tools: You are running multiple installations of the React Developer Tools extension, which will conflict with this development build of the extension.' +
              'In order to prevent conflicts, this development build of the extension will be disabled. In order to continue local development, please disable or uninstall ' +
              'any other installations of the extension in your browser.';
            chrome.devtools.inspectedWindow.eval(
              `console.error("${errorMessage}")`,
            );
            console.error(errorMessage);
            callback(true);
          } else {
            callback(false);
          }
        });
        break;
      }

      // If this extension wasn't built locally during development, we can't reliably
      // detect if there are other installations of DevTools present.
      // In this case, assume there are no duplicate exensions and show a warning about
      // potential conflicts.
      const warnMessage =
        'React Developer Tools: You are running an unrecognized installation of the React Developer Tools extension, which might conflict with other versions of the extension installed in your browser.' +
        'Please make sure you only have a single version of the extension installed or enabled.' +
        'If you are developing this extension locally, make sure to build the extension using the `yarn build:<browser>:dev` command.';
      console.warn(warnMessage);
      chrome.devtools.inspectedWindow.eval(`console.warn("${warnMessage}")`);
      callback(false);
      break;
    }
    default: {
      (EXTENSION_INSTALLATION_TYPE: empty);
    }
  }
}
