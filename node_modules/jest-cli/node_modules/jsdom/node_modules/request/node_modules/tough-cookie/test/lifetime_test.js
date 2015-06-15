/*!
 * Copyright (c) 2015, Salesforce.com, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of Salesforce.com nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';
var vows = require('vows');
var assert = require('assert');
var tough = require('../lib/cookie');
var Cookie = tough.Cookie;

vows
  .describe('Lifetime')
  .addBatch({
    "TTL with max-age": function () {
      var c = new Cookie();
      c.maxAge = 123;
      assert.equal(c.TTL(), 123000);
      assert.equal(c.expiryTime(new Date(9000000)), 9123000);
    },
    "TTL with zero max-age": function () {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.maxAge = 0; // should be treated as "earliest representable"
      assert.equal(c.TTL(), 0);
      assert.equal(c.expiryTime(new Date(9000000)), -Infinity);
      assert.ok(!c.validate()); // not valid, really: non-zero-digit *DIGIT
    },
    "TTL with negative max-age": function () {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.maxAge = -1; // should be treated as "earliest representable"
      assert.equal(c.TTL(), 0);
      assert.equal(c.expiryTime(new Date(9000000)), -Infinity);
      assert.ok(!c.validate()); // not valid, really: non-zero-digit *DIGIT
    },
    "TTL with max-age and expires": function () {
      var c = new Cookie();
      c.maxAge = 123;
      c.expires = new Date(Date.now() + 9000);
      assert.equal(c.TTL(), 123000);
      assert.ok(c.isPersistent());
    },
    "TTL with expires": function () {
      var c = new Cookie();
      var now = Date.now();
      c.expires = new Date(now + 9000);
      assert.equal(c.TTL(now), 9000);
      assert.equal(c.expiryTime(), c.expires.getTime());
    },
    "TTL with old expires": function () {
      var c = new Cookie();
      c.setExpires('17 Oct 2010 00:00:00 GMT');
      assert.ok(c.TTL() < 0);
      assert.ok(c.isPersistent());
    },
    "default TTL": {
      topic: function () {
        return new Cookie();
      },
      "is Infinite-future": function (c) {
        assert.equal(c.TTL(), Infinity)
      },
      "is a 'session' cookie": function (c) {
        assert.ok(!c.isPersistent())
      }
    }
  })
  .export(module);
