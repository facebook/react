/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMShorthandCSSPropertyCollision', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should warn for conflicting CSS shorthand updates', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div style={{font: 'foo', fontStyle: 'bar'}} />, container);
    expect(() =>
      ReactDOM.render(<div style={{font: 'foo'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender (fontStyle) ' +
        'when a conflicting property is set (font) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );

    // These updates are OK and don't warn:
    ReactDOM.render(<div style={{font: 'qux', fontStyle: 'bar'}} />, container);
    ReactDOM.render(<div style={{font: 'foo', fontStyle: 'baz'}} />, container);

    expect(() =>
      ReactDOM.render(
        <div style={{font: 'qux', fontStyle: 'baz'}} />,
        container,
      ),
    ).toErrorDev(
      'Warning: Updating a style property during rerender (font) when ' +
        'a conflicting property is set (fontStyle) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );
    expect(() =>
      ReactDOM.render(<div style={{fontStyle: 'baz'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender (font) when ' +
        'a conflicting property is set (fontStyle) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );

    // A bit of a special case: backgroundPosition isn't technically longhand
    // (it expands to backgroundPosition{X,Y} but so does background)
    ReactDOM.render(
      <div style={{background: 'yellow', backgroundPosition: 'center'}} />,
      container,
    );
    expect(() =>
      ReactDOM.render(<div style={{background: 'yellow'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender ' +
        '(backgroundPosition) when a conflicting property is set ' +
        "(background) can lead to styling bugs. To avoid this, don't mix " +
        'shorthand and non-shorthand properties for the same value; ' +
        'instead, replace the shorthand with separate values.' +
        '\n    in div (at **)',
    );
    ReactDOM.render(
      <div style={{background: 'yellow', backgroundPosition: 'center'}} />,
      container,
    );
    // But setting them  at the same time is OK:
    ReactDOM.render(
      <div style={{background: 'green', backgroundPosition: 'top'}} />,
      container,
    );
    expect(() =>
      ReactDOM.render(<div style={{backgroundPosition: 'top'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender (background) ' +
        'when a conflicting property is set (backgroundPosition) can lead ' +
        "to styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );

    // A bit of an even more special case: borderLeft and borderStyle overlap.
    ReactDOM.render(
      <div style={{borderStyle: 'dotted', borderLeft: '1px solid red'}} />,
      container,
    );
    expect(() =>
      ReactDOM.render(<div style={{borderLeft: '1px solid red'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender (borderStyle) ' +
        'when a conflicting property is set (borderLeft) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
    expect(() =>
      ReactDOM.render(
        <div style={{borderStyle: 'dashed', borderLeft: '1px solid red'}} />,
        container,
      ),
    ).toErrorDev(
      'Warning: Updating a style property during rerender (borderStyle) ' +
        'when a conflicting property is set (borderLeft) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
    // But setting them  at the same time is OK:
    ReactDOM.render(
      <div style={{borderStyle: 'dotted', borderLeft: '2px solid red'}} />,
      container,
    );
    expect(() =>
      ReactDOM.render(<div style={{borderStyle: 'dotted'}} />, container),
    ).toErrorDev(
      'Warning: Removing a style property during rerender (borderLeft) ' +
        'when a conflicting property is set (borderStyle) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
  });
});
