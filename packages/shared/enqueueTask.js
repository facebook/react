/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warningWithoutStack from './warningWithoutStack';

let didWarnAboutMessageChannel = false;
let enqueueTask;
try {
  // assuming we're in node, let's try to get node's
  // version of setImmediate, bypassing fake timers if any
  let r = require; // trick packagers not to bundle this stuff.
  enqueueTask = r('timers').setImmediate;
} catch (_err) {
  // we're in a browser
  // we can't use regular timers because they may still be faked
  // so we try MessageChannel+postMessage instead
  enqueueTask = function(callback: () => void) {
    if (__DEV__) {
      if (didWarnAboutMessageChannel === false) {
        didWarnAboutMessageChannel = true;
        warningWithoutStack(
          typeof MessageChannel !== 'undefined',
          'This browser does not have a MessageChannel implementation, ' +
            'so enqueuing tasks via await act(async () => ...) will fail. ' +
            'Please file an issue at https://github.com/facebook/react/issues ' +
            'if you encounter this warning.',
        );
      }
    }
    const channel = new MessageChannel();
    channel.port1.onmessage = callback;
    channel.port2.postMessage(undefined);
  };
}

export default enqueueTask;
