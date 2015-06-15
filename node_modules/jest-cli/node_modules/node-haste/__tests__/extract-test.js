/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('extract', function() {
  var extract = require('../lib/parse/extract');

  describe('require', function() {
    it('should extract normal requires', function() {
      var code =
        'var a = require("foo");\n' +
        'var b = require("bar");\n';
      expect(extract.requireCalls(code)).toEqual(['foo', 'bar']);
    });


    it('should not extract from comments', function() {
      var code =
        '/* a = require("b") */\n' +
        'var a = require("foo");\n' +
        '// var a = require("yada");\n' +
        'var b = require("bar");\n';
      expect(extract.requireCalls(code)).toEqual(['foo', 'bar']);
    });


    it('should extract require at the start', function() {
      var code =
        'require("foo");\n' +
        'var b = require("bar");\n';
      expect(extract.requireCalls(code)).toEqual(['foo', 'bar']);
    });


    it('should ingore non require', function() {
      var code =
        'require("foo");\n' +
        'foo.require("something");\n' +
        'foo_require("something_new");\n' +
        'var b = [require("bar")];\n';
      expect(extract.requireCalls(code)).toEqual(['foo', 'bar']);
    });


    it('should dedupe matches', function() {
      var code =
        'require("foo");\n' +
        'var b = require("foo");\n';
      expect(extract.requireCalls(code)).toEqual(['foo']);
    });
  });

  describe('requireLazy', function() {
    it('should extract simplest case', function() {
      var code =
        'requireLazy(["foo", \'bar\'], function() {\n' +
        '  return 2 + 2;\n';
        '});\n';
      expect(extract.requireLazyCalls(code)).toEqual(['foo', 'bar']);
    });

    it('should ingore invalid cases', function() {
      var code =
        'foo.requireLazy(["foo", \'bar\'], function() {\n' +
        '  return 2 + 2;\n';
        '});\n';
      expect(extract.requireLazyCalls(code)).toEqual([]);
    });

    it('should dedup', function() {
      var code =
        'requireLazy(["foo", \'bar\'], function(f, b) {\n' +
        '  requireLazy(["foo", "baz"], function(f, b) {\n' +
        '    alert(1);\n' +
        '  };\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.requireLazyCalls(code)).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('loadModules', function() {
    it('should extract simplest case', function() {
      var code =
        'Bootloader.loadModules(["foo", \'bar\'], function(f, b) {\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadModules(code)).toEqual(['foo', 'bar']);
    });

    it('should ingore invalid cases', function() {
      var code =
        'foo.Bootloader.loadModules(["foo", \'bar\'], function() {\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadModules(code)).toEqual([]);
    });

    it('should dedup', function() {
      var code =
        'Bootloader.loadModules(["foo", \'bar\'], function() {\n' +
        '  Bootloader.loadModules(["foo", "baz"], function() {\n' +
        '    alert(1);\n' +
        '  };\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadModules(code)).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('loadComponents', function() {
    it('should extract simplest case', function() {
      var code =
        'Bootloader.loadComponents(["foo", \'bar\'], function(f, b) {\n' +
        '  return 2 + 2;\n' +
        '});\n' +
        'Bootloader.loadComponents(\'baz\', function(f, b) {\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadComponents(code)).toEqual(['foo', 'bar', 'baz']);
    });

    it('should ingore invalid cases', function() {
      var code =
        'foo.Bootloader.loadComponents(["foo", \'bar\'], function() {\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadComponents(code)).toEqual([]);
    });

    it('should dedup', function() {
      var code =
        'Bootloader.loadComponents(["foo", \'bar\'], function() {\n' +
        '  Bootloader.loadComponents(["foo", "baz"], function() {\n' +
        '    alert(1);\n' +
        '  };\n' +
        '  return 2 + 2;\n' +
        '});\n';
      expect(extract.loadComponents(code)).toEqual(['foo', 'bar', 'baz']);
    });
  });
});
