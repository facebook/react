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

describe('JSMockLoader', function() {
  var JSMockLoader = require('../lib/loader/JSMockLoader');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource');

  it('should match package.json paths', function() {
    var loader = new JSMockLoader();
    expect(loader.matchPath('x.js')).toBe(false);
    expect(loader.matchPath('a/__mocks__/x.js')).toBe(true);
    expect(loader.matchPath('__mocks__/x.js')).toBe(true);
    expect(loader.matchPath('a/__mocks__/support/x.js')).toBe(false);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  it('should match package.json paths with matchSubDirs', function() {
    var loader = new JSMockLoader({ matchSubDirs: true });
    expect(loader.matchPath('x.js')).toBe(false);
    expect(loader.matchPath('a/__mocks__/x.js')).toBe(true);
    expect(loader.matchPath('__mocks__/x.js')).toBe(true);
    expect(loader.matchPath('a/__mocks__/support/x.js')).toBe(true);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSMock');

  it('should extract dependencies', function() {
    loadResouce(
      new JSMockLoader(),
      path.join(testData, '__mocks__', 'mock.js'),
      null,
      function(errors, resource) {
        expect(resource.id).toBe('mock');
        expect(resource.requiredModules).toEqual(['foo', 'bar']);
      });
  });

});
