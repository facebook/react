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
  .describe('Cookie.toJSON()')
  .addBatch({
    "JSON": {
      "serialization": {
        topic: function() {
          var c = Cookie.parse('alpha=beta; Domain=example.com; Path=/foo; Expires=Tue, 19 Jan 2038 03:14:07 GMT; HttpOnly');
          return JSON.stringify(c);
        },
        "gives a string": function(str) {
          assert.equal(typeof str, "string");
        },
        "date is in ISO format": function(str) {
          assert.match(str, /"expires":"2038-01-19T03:14:07\.000Z"/, 'expires is in ISO format');
        }
      },
      "deserialization": {
        topic: function() {
          var json = '{"key":"alpha","value":"beta","domain":"example.com","path":"/foo","expires":"2038-01-19T03:14:07.000Z","httpOnly":true,"lastAccessed":2000000000123}';
          return Cookie.fromJSON(json);
        },
        "works": function(c) {
          assert.ok(c);
        },
        "key": function(c) { assert.equal(c.key, "alpha") },
        "value": function(c) { assert.equal(c.value, "beta") },
        "domain": function(c) { assert.equal(c.domain, "example.com") },
        "path": function(c) { assert.equal(c.path, "/foo") },
        "httpOnly": function(c) { assert.strictEqual(c.httpOnly, true) },
        "secure": function(c) { assert.strictEqual(c.secure, false) },
        "hostOnly": function(c) { assert.strictEqual(c.hostOnly, null) },
        "expires is a date object": function(c) {
          assert.equal(c.expires.getTime(), 2147483647000);
        },
        "lastAccessed is a date object": function(c) {
          assert.equal(c.lastAccessed.getTime(), 2000000000123);
        },
        "creation defaulted": function(c) {
          assert.ok(c.creation.getTime());
        }
      },
      "null deserialization": {
        topic: function() {
          return Cookie.fromJSON(null);
        },
        "is null": function(cookie) {
          assert.equal(cookie,null);
        }
      }
    },
    "expiry deserialization": {
      "Infinity": {
        topic: Cookie.fromJSON.bind(null, '{"expires":"Infinity"}'),
        "is infinite": function(c) {
          assert.strictEqual(c.expires, "Infinity");
          assert.equal(c.expires, Infinity);
        }
      }
    },
    "maxAge serialization": {
      topic: function() {
        return function(toSet) {
          var c = new Cookie();
          c.key = 'foo'; c.value = 'bar';
          c.setMaxAge(toSet);
          return JSON.stringify(c);
        };
      },
      "zero": {
        topic: function(f) { return f(0) },
        "looks good": function(str) {
          assert.match(str, /"maxAge":0/);
        }
      },
      "Infinity": {
        topic: function(f) { return f(Infinity) },
        "looks good": function(str) {
          assert.match(str, /"maxAge":"Infinity"/);
        }
      },
      "-Infinity": {
        topic: function(f) { return f(-Infinity) },
        "looks good": function(str) {
          assert.match(str, /"maxAge":"-Infinity"/);
        }
      },
      "null": {
        topic: function(f) { return f(null) },
        "absent": function(str) {
          assert.match(str, /(?!"maxAge":null)/); // NB: negative RegExp
        }
      }
    },
    "maxAge deserialization": {
      "number": {
        topic: Cookie.fromJSON.bind(null,'{"key":"foo","value":"bar","maxAge":123}'),
        "is the number": function(c) {
          assert.strictEqual(c.maxAge, 123);
        }
      },
      "null": {
        topic: Cookie.fromJSON.bind(null,'{"key":"foo","value":"bar","maxAge":null}'),
        "is null": function(c) {
          assert.strictEqual(c.maxAge, null);
        }
      },
      "less than zero": {
        topic: Cookie.fromJSON.bind(null,'{"key":"foo","value":"bar","maxAge":-123}'),
        "is -123": function(c) {
          assert.strictEqual(c.maxAge, -123);
        }
      },
      "Infinity": {
        topic: Cookie.fromJSON.bind(null,'{"key":"foo","value":"bar","maxAge":"Infinity"}'),
        "is inf-as-string": function(c) {
          assert.strictEqual(c.maxAge, "Infinity");
        }
      },
      "-Infinity": {
        topic: Cookie.fromJSON.bind(null,'{"key":"foo","value":"bar","maxAge":"-Infinity"}'),
        "is inf-as-string": function(c) {
          assert.strictEqual(c.maxAge, "-Infinity");
        }
      }
    }
  })
  .export(module);
