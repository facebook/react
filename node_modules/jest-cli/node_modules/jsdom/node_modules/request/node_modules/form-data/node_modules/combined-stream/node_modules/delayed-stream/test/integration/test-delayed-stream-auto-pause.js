var common = require('../common');
var assert = common.assert;
var fake = common.fake.create();
var DelayedStream = common.DelayedStream;
var Stream = require('stream').Stream;

(function testAutoPause() {
  var source = new Stream();

  fake.expect(source, 'pause', 1);
  var delayedStream = DelayedStream.create(source);
  fake.verify();
})();

(function testDisableAutoPause() {
  var source = new Stream();
  fake.expect(source, 'pause', 0);

  var delayedStream = DelayedStream.create(source, {pauseStream: false});
  fake.verify();
})();
