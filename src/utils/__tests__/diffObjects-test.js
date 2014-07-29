/**
 * Copyright 2014 Facebook, Inc.
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
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

require('mock-modules')
  .dontMock('diffObjects');

var diffObjects;

describe('diffObjects', () => {
  var deleteSpy;
  var updateSpy;

  beforeEach(() => {
    diffObjects = require('diffObjects');

    deleteSpy = jasmine.createSpy();
    updateSpy = jasmine.createSpy();
  });

  it('should call the callback with extra params', () => {
    diffObjects({a: 1}, {a: 2}, deleteSpy, updateSpy, 'foo', 'bar');
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy.argsForCall.length).toBe(1);
    expect(updateSpy.argsForCall[0][3]).toBe('foo');
    expect(updateSpy.argsForCall[0][4]).toBe('bar');
  });

  it('should diff between null and new object', () => {
    var b = {a: 1, b: 2};
    diffObjects(null, b, deleteSpy, updateSpy, 'foo', 'bar');
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy.argsForCall.length).toBe(2);
    expect(updateSpy.argsForCall[0]).toEqual(['a', null, b, 'foo', 'bar']);
    expect(updateSpy.argsForCall[1]).toEqual(['b', null, b, 'foo', 'bar']);
  });

  it('should diff correctly when the second object is null', () => {
    var a = {a: 1, b: 2};
    diffObjects(a, null, deleteSpy, updateSpy, 'foo', 'bar');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy.argsForCall.length).toBe(2);
    expect(deleteSpy.argsForCall[0]).toEqual(['a', a, null, 'foo', 'bar']);
    expect(deleteSpy.argsForCall[1]).toEqual(['b', a, null, 'foo', 'bar']);
  });

  it('should diff two nulls', () => {
    diffObjects(null, null, deleteSpy, updateSpy, 'foo', 'bar');
    diffObjects(undefined, undefined, deleteSpy, updateSpy, 'foo', 'bar');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should add the new values correctly', () => {
    var a = {};
    var b = {a: 1, b: 2};
    diffObjects(a, b, deleteSpy, updateSpy, 'foo', 'bar');
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy.argsForCall.length).toBe(2);
    expect(updateSpy.argsForCall[0]).toEqual(['a', a, b, 'foo', 'bar']);
    expect(updateSpy.argsForCall[1]).toEqual(['b', a, b, 'foo', 'bar']);
  });

  it('should remove the old values correctly', () => {
    var a = {a: 1, b: 2};
    var b = {};
    diffObjects(a, b, deleteSpy, updateSpy, 'foo', 'bar');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy.argsForCall.length).toBe(2);
    expect(deleteSpy.argsForCall[0]).toEqual(['a', a, b, 'foo', 'bar']);
    expect(deleteSpy.argsForCall[1]).toEqual(['b', a, b, 'foo', 'bar']);
  });

  it('should update the values correctly', () => {
    var a = {a: 1, b: 2};
    var b = {a: 3, b: 4};
    diffObjects(a, b, deleteSpy, updateSpy, 'foo', 'bar');
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy.argsForCall.length).toBe(2);
    expect(updateSpy.argsForCall[0]).toEqual(['a', a, b, 'foo', 'bar']);
    expect(updateSpy.argsForCall[1]).toEqual(['b', a, b, 'foo', 'bar']);
  });

  it('should not include the values if they are not changed', () => {
    var a = {a: 1, b: 2};
    diffObjects(a, a, deleteSpy, updateSpy, 'foo', 'bar');
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should do add/remove/update correctly at the same time', () => {
    var a = {a: 1, b: 2, c: 3, d: 'bla'};
    var b = {b: 3, c: 4, d: 'bla', e: 5};
    diffObjects(a, b, deleteSpy, updateSpy, 'foo', 'bar');
    expect(updateSpy.argsForCall.length).toBe(3);
    expect(updateSpy.argsForCall[0]).toEqual(['b', a, b, 'foo', 'bar']);
    expect(updateSpy.argsForCall[1]).toEqual(['c', a, b, 'foo', 'bar']);
    expect(updateSpy.argsForCall[2]).toEqual(['e', a, b, 'foo', 'bar']);
    expect(deleteSpy.argsForCall.length).toBe(1);
    expect(deleteSpy.argsForCall[0]).toEqual(['a', a, b, 'foo', 'bar']);
  });
});
