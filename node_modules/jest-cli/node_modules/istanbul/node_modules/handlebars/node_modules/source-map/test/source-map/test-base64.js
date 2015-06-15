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

  var base64 = require('../../lib/source-map/base64');

  exports['test out of range encoding'] = function (assert, util) {
    assert.throws(function () {
      base64.encode(-1);
    });
    assert.throws(function () {
      base64.encode(64);
    });
  };

  exports['test out of range decoding'] = function (assert, util) {
    assert.throws(function () {
      base64.decode('=');
    });
  };

  exports['test normal encoding and decoding'] = function (assert, util) {
    for (var i = 0; i < 64; i++) {
      assert.equal(base64.decode(base64.encode(i)), i);
    }
  };

});
