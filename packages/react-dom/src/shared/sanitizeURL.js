/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';
import warning from 'shared/warning';
import ReactSharedInternals from 'shared/ReactSharedInternals';

let ReactDebugCurrentFrame = null;
if (__DEV__) {
  ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
}

// TODO: This is not sufficient. Will include more.
let isJavaScriptProtocol = /^\s*javascript\:/i;

function sanitizeURL(url: string) {
  invariant(
    !isJavaScriptProtocol.test(url),
    'XSS.%s',
    __DEV__ ? ReactDebugCurrentFrame.getStackAddendum() : '',
  );
}

export default sanitizeURL;
