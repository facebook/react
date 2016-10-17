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

var React = require('React');
var ReactDOMFiber = require('ReactDOMFiber');

describe('ReactDOMFiber', () => {
  var containerEl;

  beforeEach(() => {
    // to supress a warning that ReactDOMFiber is an experimental renderer.
    spyOn(console, 'error');
    containerEl = document.createElement('div');
  });

  it('should be able to render string as children', () => {
    var Foo = ({child}) => <div>{child}</div>;
    ReactDOMFiber.render(
      <Foo child="test" />,
      containerEl
    );
    expect(containerEl.textContent).toBe('test');
  });

  it('should be able to render number as children', () => {
    var Foo = ({child}) => <div>{child}</div>;
    ReactDOMFiber.render(
      <Foo child={1} />,
      containerEl
    );
    expect(containerEl.textContent).toBe('1');
  });
});
