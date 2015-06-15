/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64VLQ = require('../../lib/source-map/base64-vlq');

  exports['test normal encoding and decoding'] = function (assert, util) {
    var result = {};
    for (var i = -255; i < 256; i++) {
      base64VLQ.decode(base64VLQ.encode(i), result);
      assert.equal(result.value, i);
      assert.equal(result.rest, "");
    }
  };

});
