/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('SyntheticFocusEvent', () => {
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

  test('onFocus events have the focus type', () => {
    const log = [];
    ReactDOM.render(
      <button
        onFocus={event => log.push(`onFocus: ${event.type}`)}
        onFocusCapture={event => log.push(`onFocusCapture: ${event.type}`)}
      />,
      container,
    );
    const button = container.querySelector('button');

    button.dispatchEvent(
      new FocusEvent('focusin', {
        bubbles: true,
        cancelable: false,
      }),
    );

    expect(log).toEqual(['onFocusCapture: focus', 'onFocus: focus']);
  });

  test('onBlur events have the blur type', () => {
    const log = [];
    ReactDOM.render(
      <button
        onBlur={event => log.push(`onBlur: ${event.type}`)}
        onBlurCapture={event => log.push(`onBlurCapture: ${event.type}`)}
      />,
      container,
    );
    const button = container.querySelector('button');

    button.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        cancelable: false,
      }),
    );

    expect(log).toEqual(['onBlurCapture: blur', 'onBlur: blur']);
  });
});
