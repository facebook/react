/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactTransitionChildMapping;

describe('ReactTransitionChildMapping', () => {
  beforeEach(() => {
    React = require('React');
    ReactTransitionChildMapping = require('ReactTransitionChildMapping');
  });

  it('should support getChildMapping', () => {
    var oneone = <div key="oneone" />;
    var onetwo = <div key="onetwo" />;
    var one = <div key="one">{oneone}{onetwo}</div>;
    var two = <div key="two" />;
    var component = <div>{one}{two}</div>;
    expect(
      ReactTransitionChildMapping.getChildMapping(component.props.children),
    ).toEqual({
      '.$one': one,
      '.$two': two,
    });
  });

  it('should support mergeChildMappings for adding keys', () => {
    var prev = {
      one: true,
      two: true,
    };
    var next = {
      one: true,
      two: true,
      three: true,
    };
    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
    });
  });

  it('should support mergeChildMappings for removing keys', () => {
    var prev = {
      one: true,
      two: true,
      three: true,
    };
    var next = {
      one: true,
      two: true,
    };
    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
    });
  });

  it('should support mergeChildMappings for adding and removing', () => {
    var prev = {
      one: true,
      two: true,
      three: true,
    };
    var next = {
      one: true,
      two: true,
      four: true,
    };
    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
      four: true,
    });
  });

  it('should reconcile overlapping insertions and deletions', () => {
    var prev = {
      one: true,
      two: true,
      four: true,
      five: true,
    };
    var next = {
      one: true,
      two: true,
      three: true,
      five: true,
    };
    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
      four: true,
      five: true,
    });
  });

  it('should support mergeChildMappings with undefined input', () => {
    var prev = {
      one: true,
      two: true,
    };

    var next = undefined;

    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
    });

    prev = undefined;

    next = {
      three: true,
      four: true,
    };

    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      three: true,
      four: true,
    });
  });
});
