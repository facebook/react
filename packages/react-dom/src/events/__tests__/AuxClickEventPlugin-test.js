/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;

describe('AuxClickEventPlugin', () => {
  var container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should not fire auxclick on primary mouse button click', () => {
    let cb = jest.fn();
    let node = ReactDOM.render(<button onAuxClick={cb}>foo</button>, container);

    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );

    expect(cb).not.toBeCalled();
  });

  it('should fire auxclick on secondary mouse button click', () => {
    let cb = jest.fn();
    let node = ReactDOM.render(<button onAuxClick={cb}>foo</button>, container);

    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 1,
      }),
    );

    expect(cb).toBeCalled();
  });

  it('should respond to native auxclick', () => {
    let cb = jest.fn();
    let node = ReactDOM.render(<button onAuxClick={cb}>foo</button>, container);

    node.dispatchEvent(
      new MouseEvent('auxclick', {
        bubbles: true,
        cancelable: true,
        button: 1,
      }),
    );

    expect(cb).toBeCalled();
  });
});
