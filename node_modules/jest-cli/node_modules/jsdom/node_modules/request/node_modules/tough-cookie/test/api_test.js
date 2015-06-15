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
  .describe('API')
  .addBatch({
    "All defined": function () {
      assert.ok(Cookie);
      assert.ok(CookieJar);
    }
  })
  .addBatch({
    "Constructor": {
      topic: function () {
        return new Cookie({
          key: 'test',
          value: 'b',
          maxAge: 60
        });
      },
      'check for key property': function (c) {
        assert.ok(c);
        assert.equal(c.key, 'test');
      },
      'check for value property': function (c) {
        assert.equal(c.value, 'b');
      },
      'check for maxAge': function (c) {
        assert.equal(c.maxAge, 60);
      },
      'check for default values for unspecified properties': function (c) {
        assert.equal(c.expires, "Infinity");
        assert.equal(c.secure, false);
        assert.equal(c.httpOnly, false);
      }
    }
  })
  .addBatch({
    "expiry option": {
      topic: function () {
        var cb = this.callback;
        var cj = new CookieJar();
        cj.setCookie('near=expiry; Domain=example.com; Path=/; Max-Age=1', 'http://www.example.com', at(-1), function (err, cookie) {

          cb(err, {cj: cj, cookie: cookie});
        });
      },
      "set the cookie": function (t) {
        assert.ok(t.cookie, "didn't set?!");
        assert.equal(t.cookie.key, 'near');
      },
      "then, retrieving": {
        topic: function (t) {
          var cb = this.callback;
          setTimeout(function () {
            t.cj.getCookies('http://www.example.com', {http: true, expire: false}, function (err, cookies) {
              t.cookies = cookies;
              cb(err, t);
            });
          }, 2000);
        },
        "got the cookie": function (t) {
          assert.lengthOf(t.cookies, 1);
          assert.equal(t.cookies[0].key, 'near');
        }
      }
    }
  })
  .addBatch({
    "allPaths option": {
      topic: function () {
        var cj = new CookieJar();
        var tasks = [];
        tasks.push(cj.setCookie.bind(cj, 'nopath_dom=qq; Path=/; Domain=example.com', 'http://example.com', {}));
        tasks.push(cj.setCookie.bind(cj, 'path_dom=qq; Path=/foo; Domain=example.com', 'http://example.com', {}));
        tasks.push(cj.setCookie.bind(cj, 'nopath_host=qq; Path=/', 'http://www.example.com', {}));
        tasks.push(cj.setCookie.bind(cj, 'path_host=qq; Path=/foo', 'http://www.example.com', {}));
        tasks.push(cj.setCookie.bind(cj, 'other=qq; Path=/', 'http://other.example.com/', {}));
        tasks.push(cj.setCookie.bind(cj, 'other2=qq; Path=/foo', 'http://other.example.com/foo', {}));
        var cb = this.callback;
        async.parallel(tasks, function (err, results) {
          cb(err, {cj: cj, cookies: results});
        });
      },
      "all set": function (t) {
        assert.equal(t.cookies.length, 6);
        assert.ok(t.cookies.every(function (c) {
          return !!c
        }));
      },
      "getting without allPaths": {
        topic: function (t) {
          var cb = this.callback;
          var cj = t.cj;
          cj.getCookies('http://www.example.com/', {}, function (err, cookies) {
            cb(err, {cj: cj, cookies: cookies});
          });
        },
        "found just two cookies": function (t) {
          assert.equal(t.cookies.length, 2);
        },
        "all are path=/": function (t) {
          assert.ok(t.cookies.every(function (c) {
            return c.path === '/'
          }));
        },
        "no 'other' cookies": function (t) {
          assert.ok(!t.cookies.some(function (c) {
            return (/^other/).test(c.name)
          }));
        }
      },
      "getting without allPaths for /foo": {
        topic: function (t) {
          var cb = this.callback;
          var cj = t.cj;
          cj.getCookies('http://www.example.com/foo', {}, function (err, cookies) {
            cb(err, {cj: cj, cookies: cookies});
          });
        },
        "found four cookies": function (t) {
          assert.equal(t.cookies.length, 4);
        },
        "no 'other' cookies": function (t) {
          assert.ok(!t.cookies.some(function (c) {
            return (/^other/).test(c.name)
          }));
        }
      },
      "getting with allPaths:true": {
        topic: function (t) {
          var cb = this.callback;
          var cj = t.cj;
          cj.getCookies('http://www.example.com/', {allPaths: true}, function (err, cookies) {
            cb(err, {cj: cj, cookies: cookies});
          });
        },
        "found four cookies": function (t) {
          assert.equal(t.cookies.length, 4);
        },
        "no 'other' cookies": function (t) {
          assert.ok(!t.cookies.some(function (c) {
            return (/^other/).test(c.name)
          }));
        }
      }
    }
  })
  .addBatch({
    "Remove cookies": {
      topic: function () {
        var jar = new CookieJar();
        var cookie = Cookie.parse("a=b; Domain=example.com; Path=/");
        var cookie2 = Cookie.parse("a=b; Domain=foo.com; Path=/");
        var cookie3 = Cookie.parse("foo=bar; Domain=foo.com; Path=/");
        jar.setCookie(cookie, 'http://example.com/index.html', function () {
        });
        jar.setCookie(cookie2, 'http://foo.com/index.html', function () {
        });
        jar.setCookie(cookie3, 'http://foo.com/index.html', function () {
        });
        return jar;
      },
      "all from matching domain": function (jar) {
        jar.store.removeCookies('example.com', null, function (err) {
          assert(err == null);

          jar.store.findCookies('example.com', null, function (err, cookies) {
            assert(err == null);
            assert(cookies != null);
            assert(cookies.length === 0, 'cookie was not removed');
          });

          jar.store.findCookies('foo.com', null, function (err, cookies) {
            assert(err == null);
            assert(cookies != null);
            assert(cookies.length === 2, 'cookies should not have been removed');
          });
        });
      },
      "from cookie store matching domain and key": function (jar) {
        jar.store.removeCookie('foo.com', '/', 'foo', function (err) {
          assert(err == null);

          jar.store.findCookies('foo.com', null, function (err, cookies) {
            assert(err == null);
            assert(cookies != null);
            assert(cookies.length === 1, 'cookie was not removed correctly');
            assert(cookies[0].key === 'a', 'wrong cookie was removed');
          });
        });
      }
    }
  })
  .addBatch({
    "Synchronous CookieJar": {
      "setCookieSync": {
        topic: function () {
          var jar = new CookieJar();
          var cookie = Cookie.parse("a=b; Domain=example.com; Path=/");
          cookie = jar.setCookieSync(cookie, 'http://example.com/index.html');
          return cookie;
        },
        "returns a copy of the cookie": function (cookie) {
          assert.instanceOf(cookie, Cookie);
        }
      },
      "getCookiesSync": {
        topic: function () {
          var jar = new CookieJar();
          var url = 'http://example.com/index.html';
          jar.setCookieSync("a=b; Domain=example.com; Path=/", url);
          jar.setCookieSync("c=d; Domain=example.com; Path=/", url);
          return jar.getCookiesSync(url);
        },
        "returns the cookie array": function (err, cookies) {
          assert.ok(!err);
          assert.ok(Array.isArray(cookies));
          assert.lengthOf(cookies, 2);
          cookies.forEach(function (cookie) {
            assert.instanceOf(cookie, Cookie);
          });
        }
      },

      "getCookieStringSync": {
        topic: function () {
          var jar = new CookieJar();
          var url = 'http://example.com/index.html';
          jar.setCookieSync("a=b; Domain=example.com; Path=/", url);
          jar.setCookieSync("c=d; Domain=example.com; Path=/", url);
          return jar.getCookieStringSync(url);
        },
        "returns the cookie header string": function (err, str) {
          assert.ok(!err);
          assert.typeOf(str, 'string');
        }
      },

      "getSetCookieStringsSync": {
        topic: function () {
          var jar = new CookieJar();
          var url = 'http://example.com/index.html';
          jar.setCookieSync("a=b; Domain=example.com; Path=/", url);
          jar.setCookieSync("c=d; Domain=example.com; Path=/", url);
          return jar.getSetCookieStringsSync(url);
        },
        "returns the cookie header string": function (err, headers) {
          assert.ok(!err);
          assert.ok(Array.isArray(headers));
          assert.lengthOf(headers, 2);
          headers.forEach(function (header) {
            assert.typeOf(header, 'string');
          });
        }
      }
    }
  })
  .addBatch({
    "Synchronous API on async CookieJar": {
      topic: function () {
        return new tough.Store();
      },
      "setCookieSync": {
        topic: function (store) {
          var jar = new CookieJar(store);
          try {
            jar.setCookieSync("a=b", 'http://example.com/index.html');
            return false;
          } catch (e) {
            return e;
          }
        },
        "fails": function (err) {
          assert.instanceOf(err, Error);
          assert.equal(err.message,
            'CookieJar store is not synchronous; use async API instead.');
        }
      },
      "getCookiesSync": {
        topic: function (store) {
          var jar = new CookieJar(store);
          try {
            jar.getCookiesSync('http://example.com/index.html');
            return false;
          } catch (e) {
            return e;
          }
        },
        "fails": function (err) {
          assert.instanceOf(err, Error);
          assert.equal(err.message,
            'CookieJar store is not synchronous; use async API instead.');
        }
      },
      "getCookieStringSync": {
        topic: function (store) {
          var jar = new CookieJar(store);
          try {
            jar.getCookieStringSync('http://example.com/index.html');
            return false;
          } catch (e) {
            return e;
          }
        },
        "fails": function (err) {
          assert.instanceOf(err, Error);
          assert.equal(err.message,
            'CookieJar store is not synchronous; use async API instead.');
        }
      },
      "getSetCookieStringsSync": {
        topic: function (store) {
          var jar = new CookieJar(store);
          try {
            jar.getSetCookieStringsSync('http://example.com/index.html');
            return false;
          } catch (e) {
            return e;
          }
        },
        "fails": function (err) {
          assert.instanceOf(err, Error);
          assert.equal(err.message,
            'CookieJar store is not synchronous; use async API instead.');
        }
      }
    }
  })
  .export(module);
