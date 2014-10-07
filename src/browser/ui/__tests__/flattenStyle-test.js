/**
 * Copyright 2013-2014 Facebook, Inc.
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

"use strict";

require('mock-modules').dontMock('flattenStyle');

var flattenStyle = require('flattenStyle');

describe('StyleSheet', () => {
  var moduleA = {
    elementA: {
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB'
    },
    elementB: {
      styleB: 'moduleA/elementB/styleB'
    }
  };

  it('should not allocate an object when there is no style', () => {
    var nullStyle = flattenStyle(null);
    var nullStyleAgain = flattenStyle(null);

    expect(nullStyle).toBe(undefined);
    expect(nullStyleAgain).toBe(undefined);
  });

  it('should allocate an object when there is a style', () => {
    var style = {a: 'b'};
    var nullStyle = flattenStyle(style);

    expect(nullStyle).not.toBe(style);
  });

  it('should allocate an object when there is a single class', () => {
    var singleStyle = flattenStyle(moduleA.elementA);
    var singleStyleAgain = flattenStyle(moduleA.elementA);

    expect(singleStyle).not.toBe(singleStyleAgain);
    expect(singleStyle).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB'
    });
  });

  it('should merge single class and style properly', () => {
    var style = {styleA: 'overrideA', styleC: 'overrideC'};
    var arrayStyle = flattenStyle([moduleA.elementA, style]);

    expect(arrayStyle).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
      styleC: 'overrideC'
    });
  });

  it('should merge multiple classes', () => {
    var AthenB = flattenStyle([moduleA.elementA, moduleA.elementB]);
    var BthenA = flattenStyle([moduleA.elementB, moduleA.elementA]);

    expect(AthenB).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should merge multiple classes with style', () => {
    var style = {styleA: 'overrideA'};
    var AthenB = flattenStyle([moduleA.elementA, moduleA.elementB, style]);
    var BthenA = flattenStyle([moduleA.elementB, moduleA.elementA, style]);

    expect(AthenB).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should flatten recursively', () => {
    var style = [{styleA: 'newA', styleB: 'newB'}, {styleA: 'newA2'}];
    var AthenB = flattenStyle([moduleA.elementA, moduleA.elementB, style]);

    expect(AthenB).toEqual({
      styleA: 'newA2',
      styleB: 'newB',
    });
  });
});
