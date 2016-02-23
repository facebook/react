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

describe('sliceChildren', function() {

  let React;

  let sliceChildren;

  beforeEach(function() {
    React = require('React');

    sliceChildren = require('sliceChildren');
  });

  it('should render the whole set if start zero is supplied', function() {
    const fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
    ];
    const children = sliceChildren(fullSet, 0);
    expect(children).toEqual([
      <div key=".$A" />,
      <div key=".$B" />,
      <div key=".$C" />,
    ]);
  });

  it('should render the remaining set if no end index is supplied', function() {
    const fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
    ];
    const children = sliceChildren(fullSet, 1);
    expect(children).toEqual([
      <div key=".$B" />,
      <div key=".$C" />,
    ]);
  });

  it('should exclude everything at or after the end index', function() {
    const fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
      <div key="D" />,
    ];
    const children = sliceChildren(fullSet, 1, 2);
    expect(children).toEqual([
      <div key=".$B" />,
    ]);
  });

  it('should allow static children to be sliced', function() {
    const a = <a />;
    const b = <b />;
    const c = <i />;

    const el = <div>{a}{b}{c}</div>;
    const children = sliceChildren(el.props.children, 1, 2);
    expect(children).toEqual([
      <b key=".1" />,
    ]);
  });

  it('should slice nested children', function() {
    const fullSet = [
      <div key="A" />,
      [
        <div key="B" />,
        <div key="C" />,
      ],
      <div key="D" />,
    ];
    const children = sliceChildren(fullSet, 1, 2);
    expect(children).toEqual([
      <div key=".1:$B" />,
    ]);
  });

});
