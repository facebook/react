var common = require('../common');
var assert = common.assert;
var fake = common.fake.create();
var DelayedStream = common.DelayedStream;
var Stream = require('stream').Stream;

(function testHandleSourceErrors() {
  var source = new Stream();
  var delayedStream = DelayedStream.create(source, {pauseStream: false});

  // We deal with this by attaching a no-op listener to 'error' on the source
  // when creating a new DelayedStream. This way error events on the source
  // won't throw.
  source.emit('error', new Error('something went wrong'));
})();
