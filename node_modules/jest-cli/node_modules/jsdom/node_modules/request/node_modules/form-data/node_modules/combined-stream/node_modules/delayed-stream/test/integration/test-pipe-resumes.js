var common = require('../common');
var assert = common.assert;
var fake = common.fake.create();
var DelayedStream = common.DelayedStream;
var Stream = require('stream').Stream;

(function testPipeReleases() {
  var source = new Stream();
  var delayedStream = DelayedStream.create(source, {pauseStream: false});

  fake.expect(delayedStream, 'resume');
  delayedStream.pipe(new Stream());
})();
