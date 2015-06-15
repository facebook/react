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
  .describe('Cookie.toString()')
  .addBatch({
    "a simple cookie": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'b';
        return c;
      },
      "validates": function (c) {
        assert.ok(c.validate());
      },
      "to string": function (c) {
        assert.equal(c.toString(), 'a=b');
      }
    },
    "a cookie with spaces in the value": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'beta gamma';
        return c;
      },
      "doesn't validate": function (c) {
        assert.ok(!c.validate());
      },
      "'garbage in, garbage out'": function (c) {
        assert.equal(c.toString(), 'a=beta gamma');
      }
    },
    "with an empty value and HttpOnly": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.httpOnly = true;
        return c;
      },
      "to string": function (c) {
        assert.equal(c.toString(), 'a=; HttpOnly');
      }
    },
    "with an expiry": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'b';
        c.setExpires("Oct 18 2011 07:05:03 GMT");
        return c;
      },
      "validates": function (c) {
        assert.ok(c.validate());
      },
      "to string": function (c) {
        assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT');
      },
      "to short string": function (c) {
        assert.equal(c.cookieString(), 'a=b');
      }
    },
    "with a max-age": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'b';
        c.setExpires("Oct 18 2011 07:05:03 GMT");
        c.maxAge = 12345;
        return c;
      },
      "validates": function (c) {
        assert.ok(c.validate()); // mabe this one *shouldn't*?
      },
      "to string": function (c) {
        assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Max-Age=12345');
      }
    },
    "with a bunch of things": function () {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.setExpires("Oct 18 2011 07:05:03 GMT");
      c.maxAge = 12345;
      c.domain = 'example.com';
      c.path = '/foo';
      c.secure = true;
      c.httpOnly = true;
      c.extensions = ['MyExtension'];
      assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Max-Age=12345; Domain=example.com; Path=/foo; Secure; HttpOnly; MyExtension');
    },
    "a host-only cookie": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'b';
        c.hostOnly = true;
        c.domain = 'shouldnt-stringify.example.com';
        c.path = '/should-stringify';
        return c;
      },
      "validates": function (c) {
        assert.ok(c.validate());
      },
      "to string": function (c) {
        assert.equal(c.toString(), 'a=b; Path=/should-stringify');
      }
    },
    "minutes are '10'": {
      topic: function () {
        var c = new Cookie();
        c.key = 'a';
        c.value = 'b';
        c.expires = new Date(1284113410000);
        return c;
      },
      "validates": function (c) {
        assert.ok(c.validate());
      },
      "to string": function (c) {
        var str = c.toString();
        assert.notEqual(str, 'a=b; Expires=Fri, 010 Sep 2010 010:010:010 GMT');
        assert.equal(str, 'a=b; Expires=Fri, 10 Sep 2010 10:10:10 GMT');
      }
    }
  })
  .export(module);
