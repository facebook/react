var common = require('../common');
var assert = common.assert;
var fake = common.fake.create();
var DelayedStream = common.DelayedStream;
var Stream = require('stream').Stream;

(function testDelayEventsUntilResume() {
  var source = new Stream();
  var delayedStream = DelayedStream.create(source, {pauseStream: false});

  fake.expect(source, 'pause');
  delayedStream.pause();
  fake.verify();
})();
