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
var fs = require('fs');
var path = require('path');
var url = require('url');
var tough = require('../lib/cookie');
var Cookie = tough.Cookie;
var CookieJar = tough.CookieJar;

function readJson(filePath) {
  filePath = path.join(__dirname, filePath);
  return JSON.parse(fs.readFileSync(filePath).toString());
}

function setGetCookieVows() {
  var theVows = {};
  var data = readJson('./ietf_data/parser.json');

  data.forEach(function (testCase) {
    theVows[testCase.test] = function () {
      var jar = new CookieJar();
      var expected = testCase['sent']
      var sentFrom = 'http://home.example.org/cookie-parser?' + testCase.test;
      var sentTo = testCase['sent-to'] ?
                   url.resolve('http://home.example.org', testCase['sent-to']) :
                   'http://home.example.org/cookie-parser-result?' + testCase.test;

      testCase['received'].forEach(function (cookieStr) {
        jar.setCookieSync(cookieStr, sentFrom, {ignoreError: true});
      });

      var actual = jar.getCookiesSync(sentTo,{sort:true});

      assert.strictEqual(actual.length, expected.length);

      actual.forEach(function (actualCookie, idx) {
        var expectedCookie = expected[idx];
        assert.strictEqual(actualCookie.key, expectedCookie.name);
        assert.strictEqual(actualCookie.value, expectedCookie.value);
      });
    };
  });

  return {'Set/get cookie tests': theVows};
}

function dateVows() {
  var theVows = {};

  [
    './ietf_data/dates/bsd-examples.json',
    './ietf_data/dates/examples.json'
  ].forEach(function (filePath) {
      var data = readJson(filePath);
      var fileName = path.basename(filePath);

      data.forEach(function (testCase) {
        theVows[fileName + ' : ' + testCase.test] = function () {
          var actual = tough.parseDate(testCase.test);
          actual = actual ? actual.toUTCString() : null;
          assert.strictEqual(actual, testCase.expected);
        };
      });
    });

  return {'Date': theVows};
}

vows
  .describe('IETF http state tests')
  .addBatch(setGetCookieVows())
  .addBatch(dateVows())
  .export(module);
