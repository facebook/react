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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;
var ReactTransitionKeySet;

describe('ReactTransitionKeySet', function() {
  beforeEach(function() {
    React = require('React');
    ReactTransitionKeySet = require('ReactTransitionKeySet');
  });

  it('should support getChildMapping', function() {
    var oneone = <div key="oneone" />;
    var onetwo = <div key="onetwo" />;
    var one = <div key="one">{oneone}{onetwo}</div>;
    var two = <div key="two" />;
    var component = <div>{one}{two}</div>;
    expect(ReactTransitionKeySet.getChildMapping(component.props.children))
      .toEqual({
        '{one}': one,
        '{two}': two
      });
  });

  it('should support getKeySet', function() {
    var oneone = <div key="oneone" />;
    var onetwo = <div key="onetwo" />;
    var one = <div key="one">{oneone}{onetwo}</div>;
    var two = <div key="two" />;
    var component = <div>{one}{two}</div>;
    expect(ReactTransitionKeySet.getKeySet(component.props.children)).toEqual({
      '{one}': true,
      '{two}': true
    });
  });

  it('should support mergeKeySets for adding keys', function() {
    var prev = {
      one: true,
      two: true
    };
    var next = {
      one: true,
      two: true,
      three: true
    };
    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      one: true,
      two: true,
      three: true
    });
  });

  it('should support mergeKeySets for removing keys', function() {
    var prev = {
      one: true,
      two: true,
      three: true
    };
    var next = {
      one: true,
      two: true
    };
    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      one: true,
      two: true,
      three: true
    });
  });

  it('should support mergeKeySets for adding and removing', function() {
    var prev = {
      one: true,
      two: true,
      three: true
    };
    var next = {
      one: true,
      two: true,
      four: true
    };
    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
      four: true
    });
  });

  it('should reconcile overlapping insertions and deletions', function() {
    var prev = {
      one: true,
      two: true,
      four: true,
      five: true
    };
    var next = {
      one: true,
      two: true,
      three: true,
      five: true
    };
    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
      four: true,
      five: true
    });
  });

  it('should support mergeKeySets with undefined input', function () {
    var prev = {
      one: true,
      two: true
    };

    var next = undefined;

    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      one: true,
      two: true
    });

    prev = undefined;

    next = {
      three: true,
      four: true
    };

    expect(ReactTransitionKeySet.mergeKeySets(prev, next)).toEqual({
      three: true,
      four: true
    });
  });
});
