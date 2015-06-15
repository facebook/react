var common = require('../common');
var assert = common.assert;
var fake = common.fake.create();
var DelayedStream = common.DelayedStream;
var Stream = require('stream').Stream;

(function testProxyReadableProperty() {
  var source = new Stream();
  var delayedStream = DelayedStream.create(source, {pauseStream: false});

  source.readable = fake.value('source.readable');
  assert.strictEqual(delayedStream.readable, source.readable);
})();
