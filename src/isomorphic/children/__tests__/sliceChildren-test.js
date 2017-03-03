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

describe('sliceChildren', () => {

  var React;

  var sliceChildren;

  beforeEach(() => {
    React = require('react');

    sliceChildren = require('sliceChildren');
  });

  it('should render the whole set if start zero is supplied', () => {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
    ];
    var children = sliceChildren(fullSet, 0);
    expect(children).toEqual([
      <div key=".$A" />,
      <div key=".$B" />,
      <div key=".$C" />,
    ]);
  });

  it('should render the remaining set if no end index is supplied', () => {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
    ];
    var children = sliceChildren(fullSet, 1);
    expect(children).toEqual([
      <div key=".$B" />,
      <div key=".$C" />,
    ]);
  });

  it('should exclude everything at or after the end index', () => {
    var fullSet = [
      <div key="A" />,
      <div key="B" />,
      <div key="C" />,
      <div key="D" />,
    ];
    var children = sliceChildren(fullSet, 1, 2);
    expect(children).toEqual([
      <div key=".$B" />,
    ]);
  });

  it('should allow static children to be sliced', () => {
    var a = <a />;
    var b = <b />;
    var c = <i />;

    var el = <div>{a}{b}{c}</div>;
    var children = sliceChildren(el.props.children, 1, 2);
    expect(children).toEqual([
      <b key=".1" />,
    ]);
  });

  it('should slice nested children', () => {
    var fullSet = [
      <div key="A" />,
      [
        <div key="B" />,
        <div key="C" />,
      ],
      <div key="D" />,
    ];
    var children = sliceChildren(fullSet, 1, 2);
    expect(children).toEqual([
      <div key=".1:$B" />,
    ]);
  });

});
