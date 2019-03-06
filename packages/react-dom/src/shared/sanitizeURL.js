/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';
import warning from 'shared/warning';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {disableJavaScriptURLs} from 'shared/ReactFeatureFlags';

let ReactDebugCurrentFrame = null;
if (__DEV__) {
  ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
}

// TODO: This is not sufficient. Will include more.
let isJavaScriptProtocol = /^\s*javascript\:/i;

function sanitizeURL(url: string) {
  if (disableJavaScriptURLs) {
    invariant(
      !isJavaScriptProtocol.test(url),
      'React has blocked a javascript: URL as a security precaution.%s',
      __DEV__ ? ReactDebugCurrentFrame.getStackAddendum() : '',
    );
  } else if (__DEV__) {
    warning(
      !isJavaScriptProtocol.test(url),
      'A future version of React will block javascript: URLs as a security precaution. ' +
        'Use event handlers instead if you can. If you need to generate unsafe HTML try ' +
        'using dangerouslySetInnerHTML instead.',
    );
  }
}

export default sanitizeURL;
