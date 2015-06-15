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
var CookieJar = tough.CookieJar;

function toKeyArray(cookies) {
  return cookies.map(function (c) {
    return c.key
  });
}

vows
  .describe('Cookie sorting')
  .addBatch({
    "Assumptions:": {
      ".creationIndex is set during construction": function() {
        var now = new Date();
        var c1 = new Cookie();
        var c2 = new Cookie();
        assert.isNumber(c1.creationIndex);
        assert.isNumber(c2.creationIndex);
        assert(c1.creationIndex < c2.creationIndex,
               'creationIndex should increase with each construction');
      },

      ".creationIndex is set during construction (forced ctime)": function() {
        var now = new Date();
        var c1 = new Cookie({creation: now});
        var c2 = new Cookie({creation: now});
        assert.strictEqual(c1.creation, c2.creation);
        assert.isNumber(c1.creationIndex);
        assert.isNumber(c2.creationIndex);
        assert(c1.creationIndex < c2.creationIndex,
               'creationIndex should increase with each construction');
      },

      ".creationIndex is left alone during new setCookie": function() {
        var jar = new CookieJar();
        var c = new Cookie({key:'k', value:'v', domain:'example.com'});
        var now = new Date();
        var beforeDate = c.creation;
        assert.instanceOf(beforeDate, Date);
        assert.notStrictEqual(now, beforeDate);
        var beforeIndex = c.creationIndex;
        assert.isNumber(c.creationIndex);

        jar.setCookieSync(c, 'http://example.com/', {now: now});

        assert.strictEqual(c.creation, now);
        assert.strictEqual(c.creationIndex, beforeIndex);
      },

      ".creationIndex is preserved during update setCookie": function() {
        var jar = new CookieJar();

        var thisMs = Date.now();
        var t1 = new Date(thisMs);
        var t2 = new Date(thisMs);
        assert.notStrictEqual(t1, t2); // Date objects are distinct

        var c = new Cookie({key:'k', value:'v1', domain:'example.com'});
        jar.setCookieSync(c, 'http://example.com/', {now: t1});
        var originalIndex = c.creationIndex;

        assert.strictEqual(c.creation, t1);
        assert.strictEqual(c.lastAccessed, t1);

        c = new Cookie({key:'k', value:'v2', domain:'example.com'});
        assert.notStrictEqual(c.creation, t1); // new timestamp assigned

        jar.setCookieSync(c, 'http://example.com/', {now: t2});

        assert.strictEqual(c.creation, t1); // retained
        assert.strictEqual(c.lastAccessed, t2); // updated
        assert.strictEqual(c.creationIndex, originalIndex); // retained
      },
    }
  })
  .addBatch({
    "Cookie Sorting": {
      topic: function () {
        var cookies = [];
        cookies.push(Cookie.parse("a=0; Domain=example.com"));
        cookies.push(Cookie.parse("b=1; Domain=www.example.com"));
        cookies.push(Cookie.parse("c=2; Domain=example.com; Path=/pathA"));
        cookies.push(Cookie.parse("d=3; Domain=www.example.com; Path=/pathA"));
        cookies.push(Cookie.parse("e=4; Domain=example.com; Path=/pathA/pathB"));
        cookies.push(Cookie.parse("f=5; Domain=www.example.com; Path=/pathA/pathB"));

        // weak shuffle:
        cookies = cookies.sort(function () {
          return Math.random() - 0.5
        });

        cookies = cookies.sort(tough.cookieCompare);
        return cookies;
      },
      "got": function (cookies) {
        assert.lengthOf(cookies, 6);
        assert.deepEqual(toKeyArray(cookies), ['e', 'f', 'c', 'd', 'a', 'b']);
      }
    }
  })
  .addBatch({
    "Changing creation date affects sorting": {
      topic: function () {
        var cookies = [];
        var now = Date.now();
        cookies.push(Cookie.parse("a=0;"));
        cookies.push(Cookie.parse("b=1;"));
        cookies.push(Cookie.parse("c=2;"));

        cookies.forEach(function (cookie, idx) {
          cookie.creation = new Date(now - 100 * idx);
        });

        return cookies.sort(tough.cookieCompare);
      },
      "got": function (cookies) {
        assert.deepEqual(toKeyArray(cookies), ['c', 'b', 'a']);
      }
    }
  })
  .export(module);
