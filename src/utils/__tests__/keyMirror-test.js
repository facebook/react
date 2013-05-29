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
 * @emails react-core
 */

"use strict";

require('mock-modules').dontMock('keyMirror');

var keyMirror = require('keyMirror');

describe('keyMirror', function() {
  it('should create an object with values matching keys provided', function() {
    var mirror = keyMirror({
      foo: null,
      bar: true,
      "baz": { some: "object" },
      qux: undefined
    });
    expect('foo' in mirror).toBe(true);
    expect(mirror.foo).toBe('foo');
    expect('bar' in mirror).toBe(true);
    expect(mirror.bar).toBe('bar');
    expect('baz' in mirror).toBe(true);
    expect(mirror.baz).toBe('baz');
    expect('qux' in mirror).toBe(true);
    expect(mirror.qux).toBe('qux');
  });

  it('should not use properties from prototypes', function() {
    function Klass() {
      this.useMeToo = true;
    }
    Klass.prototype.doNotUse = true;
    var instance = new Klass();
    instance.useMe = true;

    var mirror = keyMirror(instance);

    expect('doNotUse' in mirror).toBe(false);
    expect('useMe' in mirror).toBe(true);
    expect('useMeToo' in mirror).toBe(true);
  });

  it('should throw when a non-object argument is used', function() {
    [null, undefined, 0, 7, ['uno'], true, "string"].forEach(function(testVal) {
      expect(keyMirror.bind(null, testVal)).toThrow();
    });
  });

  it('should work when "constructor" is a key', function() {
    var obj = { constructor: true };
    expect(keyMirror.bind(null, obj)).not.toThrow();
    var mirror = keyMirror(obj);
    expect('constructor' in mirror).toBe(true);
  });
});

