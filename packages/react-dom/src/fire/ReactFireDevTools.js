/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {injectIntoDevTools} from 'react-reconciler/inline.fire';
import {getClosestFiberFromDOMNode} from './ReactFireInternal';
import {canUseDOM} from 'shared/ExecutionEnvironment';
import ReactVersion from 'shared/ReactVersion';

export function setupDevTools() {
  const foundDevTools = injectIntoDevTools({
    findFiberByHostInstance: getClosestFiberFromDOMNode,
    bundleType: __DEV__ ? 1 : 0,
    version: ReactVersion,
    rendererPackageName: 'react-dom',
  });

  if (__DEV__) {
    if (!foundDevTools && canUseDOM && window.top === window.self) {
      // If we're in Chrome or Firefox, provide a download link if not installed.
      if (
        (navigator.userAgent.indexOf('Chrome') > -1 &&
          navigator.userAgent.indexOf('Edge') === -1) ||
        navigator.userAgent.indexOf('Firefox') > -1
      ) {
        const protocol = window.location.protocol;
        // Don't warn in exotic cases like chrome-extension://.
        if (/^(https?|file):$/.test(protocol)) {
          console.info(
            '%cDownload the React DevTools ' +
              'for a better development experience: ' +
              'https://fb.me/react-devtools' +
              (protocol === 'file:'
                ? '\nYou might need to use a local HTTP server (instead of file://): ' +
                  'https://fb.me/react-devtools-faq'
                : ''),
            'font-weight:bold',
          );
        }
      }
    }
  }
}
