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

describe("FileFinder", function() {
  var path = require('path');
  var finder = require('../lib/FileFinder');

  var workingDir = path.join(__dirname, '..', '__test_data__', 'FileFinder');

  it("should find files in a directory using FileFinder object", function() {
    var result,

    find = new finder({
      scanDirs: [workingDir],
      extensions: ['.js'],
      useNative: true,
      ignore: null
    });

    runs(function() {
      find.find(function(files) {
        result = files;
      });
    });

    waitsFor(function() {
      return result;
    }, 300);

    runs(function() {
      var files = result.map(function(r) {
        return r[0];
      });
      expect(files.join('\n')).toContain(path.join('sub','1.js'));
      expect(files.join('\n')).toContain(path.join('sub','2.js'));
      expect(files.join('\n')).toContain('3.js');
    });
  });

  it("should find files in a directory", function() {
    var result;
    runs(function() {
      finder.find([workingDir], ['.js'], null, function(files) {
        result = files;
      });
    });

    waitsFor(function() {
      return result;
    }, 300);

    runs(function() {
      var files = result.map(function(r) {
        return r[0];
      });
      expect(files.join('\n')).toContain(path.join('sub','1.js'));
      expect(files.join('\n')).toContain(path.join('sub','2.js'));
      expect(files.join('\n')).toContain('3.js');
    });
  });

  it("should find files in a directory using native find", function() {
    var result;
    runs(function() {
      finder.findNative([workingDir], ['.js'], null, function(files) {
        result = files;
      });
    });

    waitsFor(function() {
      return result;
    }, 300);

    runs(function() {
      var files = result.map(function(r) {
        return r[0];
      });
      expect(files.join('\n')).toContain(path.join('sub','2.js'));
      expect(files.join('\n')).toContain(path.join('sub','2.js'));
      expect(files.join('\n')).toContain('3.js');
    });
  });
});
