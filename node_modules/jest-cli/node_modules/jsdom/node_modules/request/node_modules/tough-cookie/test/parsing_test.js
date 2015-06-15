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
  .describe('Parsing')
  .addBatch({
    "simple": {
      topic: function() {
        return Cookie.parse('a=bcd') || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'a') },
      "value": function(c) { assert.equal(c.value, 'bcd') },
      "no path": function(c) { assert.equal(c.path, null) },
      "no domain": function(c) { assert.equal(c.domain, null) },
      "no extensions": function(c) { assert.ok(!c.extensions) }
    },
    "with expiry": {
      topic: function() {
        return Cookie.parse('a=bcd; Expires=Tue, 18 Oct 2011 07:05:03 GMT') || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'a') },
      "value": function(c) { assert.equal(c.value, 'bcd') },
      "has expires": function(c) {
        assert.ok(c.expires !== Infinity, 'expiry is infinite when it shouldn\'t be');
        assert.equal(c.expires.getTime(), 1318921503000);
      }
    },
    "with expiry and path": {
      topic: function() {
        return Cookie.parse('abc="xyzzy!"; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Path=/aBc') || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'abc') },
      "value": function(c) { assert.equal(c.value, '"xyzzy!"') },
      "has expires": function(c) {
        assert.ok(c.expires !== Infinity, 'expiry is infinite when it shouldn\'t be');
        assert.equal(c.expires.getTime(), 1318921503000);
      },
      "has path": function(c) { assert.equal(c.path, '/aBc'); },
      "no httponly or secure": function(c) {
        assert.ok(!c.httpOnly);
        assert.ok(!c.secure);
      }
    },
    "with everything": {
      topic: function() {
        return Cookie.parse('abc="xyzzy!"; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Path=/aBc; Domain=example.com; Secure; HTTPOnly; Max-Age=1234; Foo=Bar; Baz') || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'abc') },
      "value": function(c) { assert.equal(c.value, '"xyzzy!"') },
      "has expires": function(c) {
        assert.ok(c.expires !== Infinity, 'expiry is infinite when it shouldn\'t be');
        assert.equal(c.expires.getTime(), 1318921503000);
      },
      "has path": function(c) { assert.equal(c.path, '/aBc'); },
      "has domain": function(c) { assert.equal(c.domain, 'example.com'); },
      "has httponly": function(c) { assert.equal(c.httpOnly, true); },
      "has secure": function(c) { assert.equal(c.secure, true); },
      "has max-age": function(c) { assert.equal(c.maxAge, 1234); },
      "has extensions": function(c) {
        assert.ok(c.extensions);
        assert.equal(c.extensions[0], 'Foo=Bar');
        assert.equal(c.extensions[1], 'Baz');
      }
    },
    "invalid expires": function() {
      var c = Cookie.parse("a=b; Expires=xyzzy");
      assert.ok(c);
      assert.equal(c.expires, Infinity);
    },
    "zero max-age": function() {
      var c = Cookie.parse("a=b; Max-Age=0");
      assert.ok(c);
      assert.equal(c.maxAge, 0);
    },
    "negative max-age": function() {
      var c = Cookie.parse("a=b; Max-Age=-1");
      assert.ok(c);
      assert.equal(c.maxAge, -1);
    },
    "empty domain": function() {
      var c = Cookie.parse("a=b; domain=");
      assert.ok(c);
      assert.equal(c.domain, null);
    },
    "dot domain": function() {
      var c = Cookie.parse("a=b; domain=.");
      assert.ok(c);
      assert.equal(c.domain, null);
    },
    "uppercase domain": function() {
      var c = Cookie.parse("a=b; domain=EXAMPLE.COM");
      assert.ok(c);
      assert.equal(c.domain, 'example.com');
    },
    "trailing dot in domain": {
      topic: function() {
        return Cookie.parse("a=b; Domain=example.com.", true) || null;
      },
      "has the domain": function(c) { assert.equal(c.domain,"example.com.") },
      "but doesn't validate": function(c) { assert.equal(c.validate(),false) }
    },
    "empty path": function() {
      var c = Cookie.parse("a=b; path=");
      assert.ok(c);
      assert.equal(c.path, null);
    },
    "no-slash path": function() {
      var c = Cookie.parse("a=b; path=xyzzy");
      assert.ok(c);
      assert.equal(c.path, null);
    },
    "trailing semi-colons after path": {
      topic: function () {
        return [
          "a=b; path=/;",
          "c=d;;;;"
        ];
      },
      "strips semi-colons": function (t) {
        var c1 = Cookie.parse(t[0]);
        var c2 = Cookie.parse(t[1]);
        assert.ok(c1);
        assert.ok(c2);
        assert.equal(c1.path, '/');
      }
    },
    "secure-with-value": function() {
      var c = Cookie.parse("a=b; Secure=xyzzy");
      assert.ok(c);
      assert.equal(c.secure, true);
    },
    "httponly-with-value": function() {
      var c = Cookie.parse("a=b; HttpOnly=xyzzy");
      assert.ok(c);
      assert.equal(c.httpOnly, true);
    },
    "garbage": {
      topic: function() {
        return Cookie.parse("\x08", true) || null;
      },
      "doesn't parse": function(c) { assert.equal(c,null) }
    },
    "public suffix domain": {
      topic: function() {
        return Cookie.parse("a=b; domain=kyoto.jp", true) || null;
      },
      "parses fine": function(c) {
        assert.ok(c);
        assert.equal(c.domain, 'kyoto.jp');
      },
      "but fails validation": function(c) {
        assert.ok(c);
        assert.ok(!c.validate());
      }
    },
    "public suffix foonet.net": {
      "top level": {
        topic: function() {
          return Cookie.parse("a=b; domain=foonet.net") || null;
        },
        "parses and is valid": function(c) {
          assert.ok(c);
          assert.equal(c.domain, 'foonet.net');
          assert.ok(c.validate());
        }
      },
      "www": {
        topic: function() {
          return Cookie.parse("a=b; domain=www.foonet.net") || null;
        },
        "parses and is valid": function(c) {
          assert.ok(c);
          assert.equal(c.domain, 'www.foonet.net');
          assert.ok(c.validate());
        }
      },
      "with a dot": {
        topic: function() {
          return Cookie.parse("a=b; domain=.foonet.net") || null;
        },
        "parses and is valid": function(c) {
          assert.ok(c);
          assert.equal(c.domain, 'foonet.net');
          assert.ok(c.validate());
        }
      }
    },
    "Ironically, Google 'GAPS' cookie has very little whitespace": {
      topic: function() {
        return Cookie.parse("GAPS=1:A1aaaaAaAAa1aaAaAaaAAAaaa1a11a:aaaAaAaAa-aaaA1-;Path=/;Expires=Thu, 17-Apr-2014 02:12:29 GMT;Secure;HttpOnly");
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'GAPS') },
      "value": function(c) { assert.equal(c.value, '1:A1aaaaAaAAa1aaAaAaaAAAaaa1a11a:aaaAaAaAa-aaaA1-') },
      "path": function(c) {
        assert.notEqual(c.path, '/;Expires'); // BUG
        assert.equal(c.path, '/');
      },
      "expires": function(c) {
        assert.notEqual(c.expires, Infinity);
        assert.equal(c.expires.getTime(), 1397700749000);
      },
      "secure": function(c) { assert.ok(c.secure) },
      "httponly": function(c) { assert.ok(c.httpOnly) }
    },
    "lots of equal signs": {
      topic: function() {
        return Cookie.parse("queryPref=b=c&d=e; Path=/f=g; Expires=Thu, 17 Apr 2014 02:12:29 GMT; HttpOnly");
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'queryPref') },
      "value": function(c) { assert.equal(c.value, 'b=c&d=e') },
      "path": function(c) {
        assert.equal(c.path, '/f=g');
      },
      "expires": function(c) {
        assert.notEqual(c.expires, Infinity);
        assert.equal(c.expires.getTime(), 1397700749000);
      },
      "httponly": function(c) { assert.ok(c.httpOnly) }
    },
    "spaces in value": {
      topic: function() {
        return Cookie.parse('a=one two three',false) || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'a') },
      "value": function(c) { assert.equal(c.value, 'one two three') },
      "no path": function(c) { assert.equal(c.path, null) },
      "no domain": function(c) { assert.equal(c.domain, null) },
      "no extensions": function(c) { assert.ok(!c.extensions) }
    },
    "quoted spaces in value": {
      topic: function() {
        return Cookie.parse('a="one two three"',false) || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'a') },
      "value": function(c) { assert.equal(c.value, '"one two three"') },
      "no path": function(c) { assert.equal(c.path, null) },
      "no domain": function(c) { assert.equal(c.domain, null) },
      "no extensions": function(c) { assert.ok(!c.extensions) }
    },
    "non-ASCII in value": {
      topic: function() {
        return Cookie.parse('farbe=weiß',false) || null;
      },
      "parsed": function(c) { assert.ok(c) },
      "key": function(c) { assert.equal(c.key, 'farbe') },
      "value": function(c) { assert.equal(c.value, 'weiß') },
      "no path": function(c) { assert.equal(c.path, null) },
      "no domain": function(c) { assert.equal(c.domain, null) },
      "no extensions": function(c) { assert.ok(!c.extensions) }
    }
  })
  .export(module);
