/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var libUtil = require('../../lib/source-map/util');

  exports['test urls'] = function (assert, util) {
    var assertUrl = function (url) {
      assert.equal(url, libUtil.urlGenerate(libUtil.urlParse(url)));
    };
    assertUrl('http://');
    assertUrl('http://www.example.com');
    assertUrl('http://user:pass@www.example.com');
    assertUrl('http://www.example.com:80');
    assertUrl('http://www.example.com/');
    assertUrl('http://www.example.com/foo/bar');
    assertUrl('http://www.example.com/foo/bar/');
    assertUrl('http://user:pass@www.example.com:80/foo/bar/');

    assertUrl('//');
    assertUrl('//www.example.com');
    assertUrl('file:///www.example.com');

    assert.equal(libUtil.urlParse(''), null);
    assert.equal(libUtil.urlParse('.'), null);
    assert.equal(libUtil.urlParse('..'), null);
    assert.equal(libUtil.urlParse('a'), null);
    assert.equal(libUtil.urlParse('a/b'), null);
    assert.equal(libUtil.urlParse('a//b'), null);
    assert.equal(libUtil.urlParse('/a'), null);
    assert.equal(libUtil.urlParse('data:foo,bar'), null);
  };

  exports['test normalize()'] = function (assert, util) {
    assert.equal(libUtil.normalize('/..'), '/');
    assert.equal(libUtil.normalize('/../'), '/');
    assert.equal(libUtil.normalize('/../../../..'), '/');
    assert.equal(libUtil.normalize('/../../../../a/b/c'), '/a/b/c');
    assert.equal(libUtil.normalize('/a/b/c/../../../d/../../e'), '/e');

    assert.equal(libUtil.normalize('..'), '..');
    assert.equal(libUtil.normalize('../'), '../');
    assert.equal(libUtil.normalize('../../a/'), '../../a/');
    assert.equal(libUtil.normalize('a/..'), '.');
    assert.equal(libUtil.normalize('a/../../..'), '../..');

    assert.equal(libUtil.normalize('/.'), '/');
    assert.equal(libUtil.normalize('/./'), '/');
    assert.equal(libUtil.normalize('/./././.'), '/');
    assert.equal(libUtil.normalize('/././././a/b/c'), '/a/b/c');
    assert.equal(libUtil.normalize('/a/b/c/./././d/././e'), '/a/b/c/d/e');

    assert.equal(libUtil.normalize(''), '.');
    assert.equal(libUtil.normalize('.'), '.');
    assert.equal(libUtil.normalize('./'), '.');
    assert.equal(libUtil.normalize('././a'), 'a');
    assert.equal(libUtil.normalize('a/./'), 'a/');
    assert.equal(libUtil.normalize('a/././.'), 'a');

    assert.equal(libUtil.normalize('/a/b//c////d/////'), '/a/b/c/d/');
    assert.equal(libUtil.normalize('///a/b//c////d/////'), '///a/b/c/d/');
    assert.equal(libUtil.normalize('a/b//c////d'), 'a/b/c/d');

    assert.equal(libUtil.normalize('.///.././../a/b//./..'), '../../a')

    assert.equal(libUtil.normalize('http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.normalize('http://www.example.com/'), 'http://www.example.com/');
    assert.equal(libUtil.normalize('http://www.example.com/./..//a/b/c/.././d//'), 'http://www.example.com/a/b/d/');
  };

  exports['test join()'] = function (assert, util) {
    assert.equal(libUtil.join('a', 'b'), 'a/b');
    assert.equal(libUtil.join('a/', 'b'), 'a/b');
    assert.equal(libUtil.join('a//', 'b'), 'a/b');
    assert.equal(libUtil.join('a', 'b/'), 'a/b/');
    assert.equal(libUtil.join('a', 'b//'), 'a/b/');
    assert.equal(libUtil.join('a/', '/b'), '/b');
    assert.equal(libUtil.join('a//', '//b'), '//b');

    assert.equal(libUtil.join('a', '..'), '.');
    assert.equal(libUtil.join('a', '../b'), 'b');
    assert.equal(libUtil.join('a/b', '../c'), 'a/c');

    assert.equal(libUtil.join('a', '.'), 'a');
    assert.equal(libUtil.join('a', './b'), 'a/b');
    assert.equal(libUtil.join('a/b', './c'), 'a/b/c');

    assert.equal(libUtil.join('a', 'http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('a', 'data:foo,bar'), 'data:foo,bar');


    assert.equal(libUtil.join('', 'b'), 'b');
    assert.equal(libUtil.join('.', 'b'), 'b');
    assert.equal(libUtil.join('', 'b/'), 'b/');
    assert.equal(libUtil.join('.', 'b/'), 'b/');
    assert.equal(libUtil.join('', 'b//'), 'b/');
    assert.equal(libUtil.join('.', 'b//'), 'b/');

    assert.equal(libUtil.join('', '..'), '..');
    assert.equal(libUtil.join('.', '..'), '..');
    assert.equal(libUtil.join('', '../b'), '../b');
    assert.equal(libUtil.join('.', '../b'), '../b');

    assert.equal(libUtil.join('', '.'), '.');
    assert.equal(libUtil.join('.', '.'), '.');
    assert.equal(libUtil.join('', './b'), 'b');
    assert.equal(libUtil.join('.', './b'), 'b');

    assert.equal(libUtil.join('', 'http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('.', 'http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('', 'data:foo,bar'), 'data:foo,bar');
    assert.equal(libUtil.join('.', 'data:foo,bar'), 'data:foo,bar');


    assert.equal(libUtil.join('..', 'b'), '../b');
    assert.equal(libUtil.join('..', 'b/'), '../b/');
    assert.equal(libUtil.join('..', 'b//'), '../b/');

    assert.equal(libUtil.join('..', '..'), '../..');
    assert.equal(libUtil.join('..', '../b'), '../../b');

    assert.equal(libUtil.join('..', '.'), '..');
    assert.equal(libUtil.join('..', './b'), '../b');

    assert.equal(libUtil.join('..', 'http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('..', 'data:foo,bar'), 'data:foo,bar');


    assert.equal(libUtil.join('a', ''), 'a');
    assert.equal(libUtil.join('a', '.'), 'a');
    assert.equal(libUtil.join('a/', ''), 'a');
    assert.equal(libUtil.join('a/', '.'), 'a');
    assert.equal(libUtil.join('a//', ''), 'a');
    assert.equal(libUtil.join('a//', '.'), 'a');
    assert.equal(libUtil.join('/a', ''), '/a');
    assert.equal(libUtil.join('/a', '.'), '/a');
    assert.equal(libUtil.join('', ''), '.');
    assert.equal(libUtil.join('.', ''), '.');
    assert.equal(libUtil.join('.', ''), '.');
    assert.equal(libUtil.join('.', '.'), '.');
    assert.equal(libUtil.join('..', ''), '..');
    assert.equal(libUtil.join('..', '.'), '..');
    assert.equal(libUtil.join('http://foo.org/a', ''), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a', '.'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a/', ''), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a/', '.'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a//', ''), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a//', '.'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org', ''), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org', '.'), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org/', ''), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org/', '.'), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org//', ''), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org//', '.'), 'http://foo.org/');
    assert.equal(libUtil.join('//www.example.com', ''), '//www.example.com/');
    assert.equal(libUtil.join('//www.example.com', '.'), '//www.example.com/');


    assert.equal(libUtil.join('http://foo.org/a', 'b'), 'http://foo.org/a/b');
    assert.equal(libUtil.join('http://foo.org/a/', 'b'), 'http://foo.org/a/b');
    assert.equal(libUtil.join('http://foo.org/a//', 'b'), 'http://foo.org/a/b');
    assert.equal(libUtil.join('http://foo.org/a', 'b/'), 'http://foo.org/a/b/');
    assert.equal(libUtil.join('http://foo.org/a', 'b//'), 'http://foo.org/a/b/');
    assert.equal(libUtil.join('http://foo.org/a/', '/b'), 'http://foo.org/b');
    assert.equal(libUtil.join('http://foo.org/a//', '//b'), 'http://b');

    assert.equal(libUtil.join('http://foo.org/a', '..'), 'http://foo.org/');
    assert.equal(libUtil.join('http://foo.org/a', '../b'), 'http://foo.org/b');
    assert.equal(libUtil.join('http://foo.org/a/b', '../c'), 'http://foo.org/a/c');

    assert.equal(libUtil.join('http://foo.org/a', '.'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/a', './b'), 'http://foo.org/a/b');
    assert.equal(libUtil.join('http://foo.org/a/b', './c'), 'http://foo.org/a/b/c');

    assert.equal(libUtil.join('http://foo.org/a', 'http://www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('http://foo.org/a', 'data:foo,bar'), 'data:foo,bar');


    assert.equal(libUtil.join('http://foo.org', 'a'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/', 'a'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org//', 'a'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org', '/a'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org/', '/a'), 'http://foo.org/a');
    assert.equal(libUtil.join('http://foo.org//', '/a'), 'http://foo.org/a');


    assert.equal(libUtil.join('http://', 'www.example.com'), 'http://www.example.com');
    assert.equal(libUtil.join('file:///', 'www.example.com'), 'file:///www.example.com');
    assert.equal(libUtil.join('http://', 'ftp://example.com'), 'ftp://example.com');

    assert.equal(libUtil.join('http://www.example.com', '//foo.org/bar'), 'http://foo.org/bar');
    assert.equal(libUtil.join('//www.example.com', '//foo.org/bar'), '//foo.org/bar');
  };

  // TODO Issue #128: Define and test this function properly.
  exports['test relative()'] = function (assert, util) {
    assert.equal(libUtil.relative('/the/root', '/the/root/one.js'), 'one.js');
    assert.equal(libUtil.relative('/the/root', '/the/rootone.js'), '/the/rootone.js');

    assert.equal(libUtil.relative('', '/the/root/one.js'), '/the/root/one.js');
    assert.equal(libUtil.relative('.', '/the/root/one.js'), '/the/root/one.js');
    assert.equal(libUtil.relative('', 'the/root/one.js'), 'the/root/one.js');
    assert.equal(libUtil.relative('.', 'the/root/one.js'), 'the/root/one.js');

    assert.equal(libUtil.relative('/', '/the/root/one.js'), 'the/root/one.js');
    assert.equal(libUtil.relative('/', 'the/root/one.js'), 'the/root/one.js');
  };

});
