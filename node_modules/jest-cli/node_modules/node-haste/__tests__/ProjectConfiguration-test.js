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

describe('ProjectConfiguration', function() {
  var path = require('path');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should return non-haste affecteded roots', function() {
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expect(resource.getHasteRoots()).toEqual([path.join('a','b')]);
  });

  it('should return haste affecteded roots', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests']
      }});
    expect(resource.getHasteRoots()).toEqual([path.join('a','b','lib'), path.join('a','b','tests')]);
  });

  it('should resolve id with a prefix', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests'],
        prefix: "bar"
      }});
    expect(resource.resolveID(path.join('a','b','lib','foo'))).toEqual(path.join('bar','foo'));
  });

  it('should resolve id without a prefix', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests'],
        prefix: ""
      }});
    expect(resource.resolveID(path.join('a','b','lib','foo'))).toEqual('foo');
  });

});
