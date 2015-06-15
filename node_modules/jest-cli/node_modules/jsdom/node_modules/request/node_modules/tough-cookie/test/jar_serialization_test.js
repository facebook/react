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
var Store = tough.Store;
var MemoryCookieStore = tough.MemoryCookieStore;
var VERSION = require('../package.json').version;

var domains = ['example.com','www.example.com','example.net'];
var paths = ['/','/foo','/foo/bar'];

var isInteger = Number.isInteger || function(value) {
  // Node 0.10 (still supported) doesn't have Number.isInteger
  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
  return typeof value === "number" &&
    isFinite(value) &&
    Math.floor(value) === value;
};

function setUp(context) {
  context.now = new Date();
  context.nowISO = context.now.toISOString();
  context.expires = new Date(context.now.getTime() + 86400000);

  var c, domain;
  context.jar = new CookieJar();

  context.totalCookies = 0;

  // Do paths first since the MemoryCookieStore index is domain at the top
  // level. This should cause the preservation of creation order in
  // getAllCookies to be exercised.
  for (var i = 0; i<paths.length; i++) {
    var path = paths[i];
    for (var j = 0; j<domains.length; j++) {
      domain = domains[j];
      c = new Cookie({
        expires: context.expires,
        domain: domain,
        path: path,
        key: 'key',
        value: 'value'+j+i
      });
      context.jar.setCookieSync(c, 'http://'+domain+'/', {now: context.now});
      context.totalCookies++;
    }
  }

  // corner cases
  domain = 'example.com';
  var cornerCases = [
    { expires: 'Infinity', key: 'infExp', value: 'infExp' },
    { maxAge: 3600, key: 'max', value: 'max' },
    { expires: context.expires, key: 'flags', value: 'flags',
      secure: true, httpOnly: true },
    { expires: context.expires, key: 'honly', value: 'honly',
      hostOnly: true, domain: 'www.example.org' },
  ];

  for (var i = 0; i<cornerCases.length; i++) {
    cornerCases[i].domain = cornerCases[i].domain || 'example.org';
    cornerCases[i].path = '/';
    c = new Cookie(cornerCases[i]);
    context.jar.setCookieSync(c, 'https://www.example.org/', {now: context.now});
    context.totalCookies++;
  }
}

function checkMetadata(serialized) {
  assert.notEqual(serialized, null);
  assert.isObject(serialized);
  assert.equal(serialized.version, 'tough-cookie@'+VERSION);
  assert.equal(serialized.storeType, 'MemoryCookieStore');
  assert.typeOf(serialized.rejectPublicSuffixes, 'boolean');
  assert.isArray(serialized.cookies);
}

var serializedCookiePropTypes = {
  'key': 'string',
  'value': 'string',
  'expires': 'isoDate', // if "Infinity" it's supposed to be missing
  'maxAge': 'intOrInf',
  'domain': 'string',
  'path': 'string',
  'secure': 'boolean',
  'httpOnly': 'boolean',
  'extensions': 'array', // of strings, technically
  'hostOnly': 'boolean',
  'pathIsDefault': 'boolean',
  'creation': 'isoDate',
  'lastAccessed': 'isoDate'
};

function validateSerializedCookie(cookie) {
  assert.isObject(cookie);
  assert.isFalse(cookie instanceof Cookie);

  Object.keys(cookie).forEach(function(prop) {
    var type = serializedCookiePropTypes[prop];
    switch(type) {
    case 'string':
    case 'boolean':
    case 'array':
    case 'number':
      assert.typeOf(cookie[prop], type);
      break;

    case 'intOrInf':
      if (cookie[prop] === 'Infinity' || cookie[prop] === '-Infinity') {
        assert(true);
      } else {
        assert(isInteger(cookie[prop]),
               "serialized property isn't integer: "+prop);
      }
      break;

    case 'isoDate':
      // rather than a regexp, assert it's parsable and equal
      var parsed = Date.parse(cookie[prop]);
      assert(parsed, 'could not parse serialized date property');
      // assert.equals(cookie[prop], parsed.toISOString());
      break;

    default:
      assert.fail("unexpected serialized property: "+prop);
    }
  });

}

vows
  .describe('CookieJar serialization')
  .addBatch({
    "Assumptions:": {
      "serializableProperties all accounted for": function() {
        var actualKeys = Cookie.serializableProperties.concat([]); // copy
        actualKeys.sort();
        var expectedKeys = Object.keys(serializedCookiePropTypes);
        expectedKeys.sort();
        assert.deepEqual(actualKeys, expectedKeys);
      }
    }
  })
  .addBatch({
    "For Stores without getAllCookies": {
      topic: function() {
        var store = new Store();
        store.synchronous = true;
        var jar = new CookieJar(store);
        return jar;
      },
      "Cannot call toJSON": function(jar) {
        assert.throws(function() {
          jar.toJSON();
        }, 'getAllCookies is not implemented (therefore jar cannot be serialized)');
      }
    }
  })
  .addBatch({
    "For async stores": {
      topic: function() {
        var store = new MemoryCookieStore();
        store.synchronous = false; // pretend it's async
        var jar = new CookieJar(store);
        return jar;
      },
      "Cannot call toJSON": function(jar) {
        assert.throws(function() {
          jar.toJSON();
        }, 'CookieJar store is not synchronous; use async API instead.');
      }
    }
  })
  .addBatch({
    "With a small store": {
      topic: function() {
        var now = this.now = new Date();
        this.jar = new CookieJar();
        // domain cookie with custom extension
        var cookie = Cookie.parse('sid=one; domain=example.com; path=/; fubar');
        this.jar.setCookieSync(cookie, 'http://example.com/', {now: this.now});

        cookie = Cookie.parse('sid=two; domain=example.net; path=/; fubar');
        this.jar.setCookieSync(cookie, 'http://example.net/', {now: this.now});

        return this.jar;
      },

      "serialize synchronously": {
        topic: function(jar) {
          return jar.serializeSync();
        },
        "it gives a serialization with the two cookies": function(data) {
          checkMetadata(data);
          assert.equal(data.cookies.length, 2);
          data.cookies.forEach(function(cookie) {
            validateSerializedCookie(cookie);
          });
        },
        "then deserialize": {
          topic: function(data) {
            return CookieJar.deserializeSync(data);
          },
          "memstores are identical": function(newJar) {
            assert.deepEqual(this.jar.store, newJar.store);
          }
        }
      },

      "serialize asynchronously": {
        topic: function(jar) {
          jar.serialize(this.callback);
        },
        "it gives a serialization with the two cookies": function(data) {
          checkMetadata(data);
          assert.equal(data.cookies.length, 2);
          data.cookies.forEach(function(cookie) {
            validateSerializedCookie(cookie);
          });
        },
        "then deserialize": {
          topic: function(data) {
            CookieJar.deserialize(data, this.callback);
          },
          "memstores are identical": function(newJar) {
            assert.deepEqual(this.jar.store, newJar.store);
          }
        }
      }
    }
  })
  .addBatch({
    "With a moderately-sized store": {
      topic: function() {
        setUp(this);
        this.jar.serialize(this.callback);
      },
      "has expected metadata": function(err,jsonObj) {
        assert.isNull(err);
        assert.equal(jsonObj.version, 'tough-cookie@'+VERSION);
        assert.isTrue(jsonObj.rejectPublicSuffixes);
        assert.equal(jsonObj.storeType, 'MemoryCookieStore');
      },
      "has a bunch of objects as 'raw' cookies": function(jsonObj) {
        assert.isArray(jsonObj.cookies);
        assert.equal(jsonObj.cookies.length, this.totalCookies);

        jsonObj.cookies.forEach(function(cookie) {
          validateSerializedCookie(cookie);

          if (cookie.key === 'key') {
            assert.match(cookie.value, /^value\d\d/);
          }

          if (cookie.key === 'infExp' || cookie.key === 'max') {
            assert.isUndefined(cookie.expires);
          } else {
            assert.strictEqual(cookie.expires, this.expires.toISOString())
          }

          if (cookie.key === 'max') {
            assert.strictEqual(cookie.maxAge, 3600);
          } else {
            assert.isUndefined(cookie.maxAge);
          }

          assert.equal(cookie.hostOnly, cookie.key === 'honly');

          if (cookie.key === 'flags') {
            assert.isTrue(cookie.secure);
            assert.isTrue(cookie.httpOnly);
          } else {
            assert.isUndefined(cookie.secure);
            assert.isUndefined(cookie.httpOnly);
          }

          assert.strictEqual(cookie.creation, this.nowISO);
          assert.strictEqual(cookie.lastAccessed, this.nowISO);

        }, this);
      },

      "then taking it for a round-trip": {
        topic: function(jsonObj) {
          CookieJar.deserialize(jsonObj, this.callback);
        },
        "memstore index is identical": function(err,newJar) {
          assert.deepEqual(newJar.store.idx, this.jar.store.idx);
        },
        "then spot-check retrieval": {
          topic: function(newJar) {
            newJar.getCookies('http://example.org/', this.callback);
          },
          "gets expected cookies": function(results) {
            assert.isArray(results);
            assert.equal(results.length, 2);

            results.forEach(function(cookie) {
              assert.instanceOf(cookie, Cookie);

              if (cookie.key === 'infExp') {
                assert.strictEqual(cookie.expires, "Infinity");
                assert.strictEqual(cookie.TTL(this.now), Infinity);
              } else if (cookie.key === 'max') {
                assert.strictEqual(cookie.TTL(this.now), 3600*1000);
              } else {
                assert.fail('Unexpected cookie key: '+cookie.key);
              }
            }.bind(this));
          }
        }
      }
    }
  })
  .export(module);
