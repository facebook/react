/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule testMinificationUsedDCE
 */

'use strict';

function testMinificationUsedDCE() {
  if (process.env.NODE_ENV === 'production') {
    // use scoped variable for our initial test, in case
    // 'top-level' mangling is not enabled.
    const source = testMinificationUsedDCE.toString();
    const longVariableName = source;
    if (longVariableName &&
        source.match(/longVariableName/g).length === 3) {
      // We are not minified.
      // This might be a Node environment where DCE is not expected anyway.
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      // We expect this method only to be called in production.
      throw new Error('This is unreachable');
    }
    try {
      if (source.match(/toString/g).length !== 2) {
        // We always look for two matches:
        // The actual occurence and then the call to 'match'
        //
        // We know for a fact the above line exists so there should be 2
        // matches.
        // Therefore the browser gave us invalid source.
        return;
      }
      if (source.match(/unreachable/g).length === 2) {
        // We always look for two matches:
        // The actual occurence and then the call to 'match'

        // Dead code elimination would have stripped that branch
        // because it is impossible to reach in production.
        setTimeout(function() {
          // Ensure it gets reported to production logging
          throw new Error('React is running in production mode, but dead code '
                          + 'elimination has not been applied. Read how to correctly '
                          + 'configure React for production: '
                          + 'https://fburl.com/react-perf-use-the-production-build');
        });
      }
    } catch (e) {}
  }
}

module.exports = testMinificationUsedDCE;
