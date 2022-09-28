/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {disableJavaScriptURLs} from 'shared/ReactFeatureFlags';

// A javascript: URL can contain leading C0 control or \u0020 SPACE,
// and any newline or tab are filtered out as if they're not part of the URL.
// https://url.spec.whatwg.org/#url-parsing
// Tab or newline are defined as \r\n\t:
// https://infra.spec.whatwg.org/#ascii-tab-or-newline
// A C0 control is a code point in the range \u0000 NULL to \u001F
// INFORMATION SEPARATOR ONE, inclusive:
// https://infra.spec.whatwg.org/#c0-control-or-space

/* eslint-disable max-len */
const isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

let didWarn = false;

function sanitizeURL(url: string) {
  if (disableJavaScriptURLs) {
    if (isJavaScriptProtocol.test(url)) {
      throw new Error(
        'React has blocked a javascript: URL as a security precaution.',
      );
    }
  } else if (__DEV__) {
    if (!didWarn && isJavaScriptProtocol.test(url)) {
      didWarn = true;
      console.error(
        'A future version of React will block javascript: URLs as a security precaution. ' +
          'Use event handlers instead if you can. If you need to generate unsafe HTML try ' +
          'using dangerouslySetInnerHTML instead. React was passed %s.',
        JSON.stringify(url),
      );
    }
  }
}

export default sanitizeURL;
