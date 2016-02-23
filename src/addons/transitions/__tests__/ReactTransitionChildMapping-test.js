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

let React;
let ReactTransitionChildMapping;

describe('ReactTransitionChildMapping', function() {
  beforeEach(function() {
    React = require('React');
    ReactTransitionChildMapping = require('ReactTransitionChildMapping');
  });

  it('should support getChildMapping', function() {
    const oneone = <div key="oneone" />;
    const onetwo = <div key="onetwo" />;
    const one = <div key="one">{oneone}{onetwo}</div>;
    const two = <div key="two" />;
    const component = <div>{one}{two}</div>;
    expect(
      ReactTransitionChildMapping.getChildMapping(component.props.children)
    ).toEqual({
      '.$one': one,
      '.$two': two,
    });
  });

  it('should support mergeChildMappings for adding keys', function() {
    const prev = {
      one: true,
      two: true,
    };
    const next = {
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

  it('should support mergeChildMappings for removing keys', function() {
    const prev = {
      one: true,
      two: true,
      three: true,
    };
    const next = {
      one: true,
      two: true,
    };
    expect(ReactTransitionChildMapping.mergeChildMappings(prev, next)).toEqual({
      one: true,
      two: true,
      three: true,
    });
  });

  it('should support mergeChildMappings for adding and removing', function() {
    const prev = {
      one: true,
      two: true,
      three: true,
    };
    const next = {
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

  it('should reconcile overlapping insertions and deletions', function() {
    const prev = {
      one: true,
      two: true,
      four: true,
      five: true,
    };
    const next = {
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

  it('should support mergeChildMappings with undefined input', function() {
    let prev = {
      one: true,
      two: true,
    };

    let next = undefined;

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
