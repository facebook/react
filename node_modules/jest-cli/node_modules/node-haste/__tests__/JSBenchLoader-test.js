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

describe('JSBenchLoader', function() {
  var JSBenchLoader = require('../lib/loader/JSBenchLoader');
  var path = require('path');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var loadResouce = require('../lib/test_helpers/loadResource');

  it('should match package.json paths', function() {
    var loader = new JSBenchLoader();
    expect(loader.matchPath('x.js')).toBe(false);
    expect(loader.matchPath('a/__benchmarks__/x.js')).toBe(true);
    expect(loader.matchPath('__benchmarks__/x.js')).toBe(true);
    expect(loader.matchPath('a/__benchmarks__/support/x.js')).toBe(false);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  it('should match package.json paths with matchSubDirs', function() {
    var loader = new JSBenchLoader({ matchSubDirs: true });
    expect(loader.matchPath('x.js')).toBe(false);
    expect(loader.matchPath('a/__benchmarks__/x.js')).toBe(true);
    expect(loader.matchPath('__benchmarks__/x.js')).toBe(true);
    expect(loader.matchPath('a/__benchmarks__/support/x.js')).toBe(true);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSBench');

  it('should extract dependencies', function() {
    loadResouce(
      new JSBenchLoader(),
      path.join(testData, '__benchmarks__/html-bench.js'),
      null,
      function(errors, resource) {
        expect(resource.id).toBe('html-bench');
        expect(resource.requiredModules)
          .toEqual(['htmlSpecialChars']);
        expect(resource.contacts).toEqual(['foo@bar.com']);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new JSBenchLoader(),
      path.join(testData, 'configured', '__benchmarks__', 'test-bench.js'),
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      function(errors, resource) {
        expect(resource.id).toBe(path.join('configured','__benchmarks__','test-bench.js'));
      });
  });

});
