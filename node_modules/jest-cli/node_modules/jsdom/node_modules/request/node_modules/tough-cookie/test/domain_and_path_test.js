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

function matchVows(func, table) {
  var theVows = {};
  table.forEach(function (item) {
    var str = item[0];
    var dom = item[1];
    var expect = item[2];
    var label = str + (expect ? " matches " : " doesn't match ") + dom;
    theVows[label] = function () {
      assert.equal(func(str, dom), expect);
    };
  });
  return theVows;
}

function defaultPathVows(table) {
  var theVows = {};
  table.forEach(function (item) {
    var str = item[0];
    var expect = item[1];
    var label = str + " gives " + expect;
    theVows[label] = function () {
      assert.equal(tough.defaultPath(str), expect);
    };
  });
  return theVows;
}

vows
  .describe('Domain and Path')
  .addBatch({
    "domain normalization": {
      "simple": function () {
        var c = new Cookie();
        c.domain = "EXAMPLE.com";
        assert.equal(c.canonicalizedDomain(), "example.com");
      },
      "extra dots": function () {
        var c = new Cookie();
        c.domain = ".EXAMPLE.com";
        assert.equal(c.cdomain(), "example.com");
      },
      "weird trailing dot": function () {
        var c = new Cookie();
        c.domain = "EXAMPLE.ca.";
        assert.equal(c.canonicalizedDomain(), "example.ca.");
      },
      "weird internal dots": function () {
        var c = new Cookie();
        c.domain = "EXAMPLE...ca.";
        assert.equal(c.canonicalizedDomain(), "example...ca.");
      },
      "IDN": function () {
        var c = new Cookie();
        c.domain = "δοκιμή.δοκιμή"; // "test.test" in greek
        assert.equal(c.canonicalizedDomain(), "xn--jxalpdlp.xn--jxalpdlp");
      }
    }
  })
  .addBatch({
    "Domain Match": matchVows(tough.domainMatch, [
      // str,          dom,          expect
      ["example.com", "example.com", true],
      ["eXaMpLe.cOm", "ExAmPlE.CoM", true],
      ["no.ca", "yes.ca", false],
      ["wwwexample.com", "example.com", false],
      ["www.example.com", "example.com", true],
      ["example.com", "www.example.com", false],
      ["www.subdom.example.com", "example.com", true],
      ["www.subdom.example.com", "subdom.example.com", true],
      ["example.com", "example.com.", false], // RFC6265 S4.1.2.3
      ["192.168.0.1", "168.0.1", false], // S5.1.3 "The string is a host name"
      [null, "example.com", null],
      ["example.com", null, null],
      [null, null, null],
      [undefined, undefined, null],
    ])
  })

  .addBatch({
    "default-path": defaultPathVows([
      [null, "/"],
      ["/", "/"],
      ["/file", "/"],
      ["/dir/file", "/dir"],
      ["noslash", "/"],
    ])
  })
  .addBatch({
    "Path-Match": matchVows(tough.pathMatch, [
      // request, cookie, match
      ["/", "/", true],
      ["/dir", "/", true],
      ["/", "/dir", false],
      ["/dir/", "/dir/", true],
      ["/dir/file", "/dir/", true],
      ["/dir/file", "/dir", true],
      ["/directory", "/dir", false],
    ])
  })
  .addBatch({
    "permuteDomain": {
      "base case": {
        topic: tough.permuteDomain.bind(null, 'example.com'),
        "got the domain": function (list) {
          assert.deepEqual(list, ['example.com']);
        }
      },
      "two levels": {
        topic: tough.permuteDomain.bind(null, 'foo.bar.example.com'),
        "got three things": function (list) {
          assert.deepEqual(list, ['example.com', 'bar.example.com', 'foo.bar.example.com']);
        }
      },
      "local domain": {
        topic: tough.permuteDomain.bind(null, 'foo.bar.example.localduhmain'),
        "got three things": function (list) {
          assert.deepEqual(list,  ['example.localduhmain', 'bar.example.localduhmain', 'foo.bar.example.localduhmain']);
        }
      }
    },
    "permutePath": {
      "base case": {
        topic: tough.permutePath.bind(null, '/'),
        "just slash": function (list) {
          assert.deepEqual(list, ['/']);
        }
      },
      "single case": {
        topic: tough.permutePath.bind(null, '/foo'),
        "two things": function (list) {
          assert.deepEqual(list, ['/foo', '/']);
        },
        "path matching": function (list) {
          list.forEach(function (e) {
            assert.ok(tough.pathMatch('/foo', e));
          });
        }
      },
      "double case": {
        topic: tough.permutePath.bind(null, '/foo/bar'),
        "four things": function (list) {
          assert.deepEqual(list, ['/foo/bar', '/foo', '/']);
        },
        "path matching": function (list) {
          list.forEach(function (e) {
            assert.ok(tough.pathMatch('/foo/bar', e));
          });
        }
      },
      "trailing slash": {
        topic: tough.permutePath.bind(null, '/foo/bar/'),
        "three things": function (list) {
          assert.deepEqual(list, ['/foo/bar', '/foo', '/']);
        },
        "path matching": function (list) {
          list.forEach(function (e) {
            assert.ok(tough.pathMatch('/foo/bar/', e));
          });
        }
      }
    }
  })
  .export(module);

