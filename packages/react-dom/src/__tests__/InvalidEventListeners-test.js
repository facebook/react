/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

jest.mock('../events/isEventSupported');

describe('InvalidEventListeners', () => {
  let React;
  let ReactDOM;
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should prevent non-function listeners, at dispatch', () => {
    let node;
    expect(() => {
      node = ReactDOM.render(<div onClick="not a function" />, container);
    }).toErrorDev(
      'Expected `onClick` listener to be a function, instead got a value of `string` type.',
    );

    spyOnProd(console, 'error');

    const uncaughtErrors = [];
    function handleWindowError(e) {
      uncaughtErrors.push(e.error);
    }
    window.addEventListener('error', handleWindowError);
    try {
      node.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
        }),
      );
    } finally {
      window.removeEventListener('error', handleWindowError);
    }
    expect(uncaughtErrors.length).toBe(1);
    expect(uncaughtErrors[0]).toEqual(
      expect.objectContaining({
        message:
          'Expected `onClick` listener to be a function, ' +
          'instead got a value of `string` type.',
      }),
    );

    if (!__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.calls.argsFor(0)[0]).toMatch(
        'Expected `onClick` listener to be a function, ' +
          'instead got a value of `string` type.',
      );
    }
  });

  it('should not prevent null listeners, at dispatch', () => {
    const node = ReactDOM.render(<div onClick={null} />, container);
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
      }),
    );
  });
});
