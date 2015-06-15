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
var async = require('async');
var tough = require('../lib/cookie');
var Cookie = tough.Cookie;
var CookieJar = tough.CookieJar;

var atNow = Date.now();

function at(offset) {
  return {now: new Date(atNow + offset)};
}

vows
  .describe('Regression tests')
  .addBatch({
    "Issue 1": {
      topic: function () {
        var cj = new CookieJar();
        cj.setCookie('hello=world; path=/some/path/', 'http://domain/some/path/file', function (err, cookie) {
          this.callback(err, {cj: cj, cookie: cookie});
        }.bind(this));
      },
      "stored a cookie": function (t) {
        assert.ok(t.cookie);
      },
      "getting it back": {
        topic: function (t) {
          t.cj.getCookies('http://domain/some/path/file', function (err, cookies) {
            this.callback(err, {cj: t.cj, cookies: cookies || []});
          }.bind(this));
        },
        "got one cookie": function (t) {
          assert.lengthOf(t.cookies, 1);
        },
        "it's the right one": function (t) {
          var c = t.cookies[0];
          assert.equal(c.key, 'hello');
          assert.equal(c.value, 'world');
        }
      }
    }
  })
  .addBatch({
    "trailing semi-colon set into cj": {
      topic: function () {
        var cb = this.callback;
        var cj = new CookieJar();
        var ex = 'http://www.example.com';
        var tasks = [];
        tasks.push(function (next) {
          cj.setCookie('broken_path=testme; path=/;', ex, at(-1), next);
        });
        tasks.push(function (next) {
          cj.setCookie('b=2; Path=/;;;;', ex, at(-1), next);
        });
        async.parallel(tasks, function (err, cookies) {
          cb(null, {
            cj: cj,
            cookies: cookies
          });
        });
      },
      "check number of cookies": function (t) {
        assert.lengthOf(t.cookies, 2, "didn't set");
      },
      "check *broken_path* was set properly": function (t) {
        assert.equal(t.cookies[0].key, "broken_path");
        assert.equal(t.cookies[0].value, "testme");
        assert.equal(t.cookies[0].path, "/");
      },
      "check *b* was set properly": function (t) {
        assert.equal(t.cookies[1].key, "b");
        assert.equal(t.cookies[1].value, "2");
        assert.equal(t.cookies[1].path, "/");
      },
      "retrieve the cookie": {
        topic: function (t) {
          var cb = this.callback;
          t.cj.getCookies('http://www.example.com', {}, function (err, cookies) {
            t.cookies = cookies;
            cb(err, t);
          });
        },
        "get the cookie": function (t) {
          assert.lengthOf(t.cookies, 2);
          assert.equal(t.cookies[0].key, 'broken_path');
          assert.equal(t.cookies[0].value, 'testme');
          assert.equal(t.cookies[1].key, "b");
          assert.equal(t.cookies[1].value, "2");
          assert.equal(t.cookies[1].path, "/");
        }
      }
    }
  })
  .addBatch({
    "tough-cookie throws exception on malformed URI (GH-32)": {
      topic: function () {
        var url = "http://www.example.com/?test=100%";
        var cj = new CookieJar();

        cj.setCookieSync("Test=Test", url);

        return cj.getCookieStringSync(url);
      },
      "cookies are set": function (cookieStr) {
        assert.strictEqual(cookieStr, "Test=Test");
      }
    }
  })
  .export(module);
