/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMShorthandCSSPropertyCollision', () => {
  let act;

  let React;
  let ReactDOMClient;

  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
  });

  it('should warn for conflicting CSS shorthand updates', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div style={{font: 'foo', fontStyle: 'bar'}} />);
    });
    await expect(async () => {
      await act(() => {
        root.render(<div style={{font: 'foo'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender (fontStyle) ' +
        'when a conflicting property is set (font) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );

    // These updates are OK and don't warn:
    await act(() => {
      root.render(<div style={{font: 'qux', fontStyle: 'bar'}} />);
    });
    await act(() => {
      root.render(<div style={{font: 'foo', fontStyle: 'baz'}} />);
    });

    await expect(async () => {
      await act(() => {
        root.render(<div style={{font: 'qux', fontStyle: 'baz'}} />);
      });
    }).toErrorDev(
      'Updating a style property during rerender (font) when ' +
        'a conflicting property is set (fontStyle) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );
    await expect(async () => {
      await act(() => {
        root.render(<div style={{fontStyle: 'baz'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender (font) when ' +
        'a conflicting property is set (fontStyle) can lead to styling ' +
        "bugs. To avoid this, don't mix shorthand and non-shorthand " +
        'properties for the same value; instead, replace the shorthand ' +
        'with separate values.' +
        '\n    in div (at **)',
    );

    // A bit of a special case: backgroundPosition isn't technically longhand
    // (it expands to backgroundPosition{X,Y} but so does background)
    await act(() => {
      root.render(
        <div style={{background: 'yellow', backgroundPosition: 'center'}} />,
      );
    });
    await expect(async () => {
      await act(() => {
        root.render(<div style={{background: 'yellow'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender ' +
        '(backgroundPosition) when a conflicting property is set ' +
        "(background) can lead to styling bugs. To avoid this, don't mix " +
        'shorthand and non-shorthand properties for the same value; ' +
        'instead, replace the shorthand with separate values.' +
        '\n    in div (at **)',
    );
    await act(() => {
      root.render(
        <div style={{background: 'yellow', backgroundPosition: 'center'}} />,
      );
    });
    // But setting them  at the same time is OK:
    await act(() => {
      root.render(
        <div style={{background: 'green', backgroundPosition: 'top'}} />,
      );
    });
    await expect(async () => {
      await act(() => {
        root.render(<div style={{backgroundPosition: 'top'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender (background) ' +
        'when a conflicting property is set (backgroundPosition) can lead ' +
        "to styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );

    // A bit of an even more special case: borderLeft and borderStyle overlap.
    await act(() => {
      root.render(
        <div style={{borderStyle: 'dotted', borderLeft: '1px solid red'}} />,
      );
    });
    await expect(async () => {
      await act(() => {
        root.render(<div style={{borderLeft: '1px solid red'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender (borderStyle) ' +
        'when a conflicting property is set (borderLeft) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
    await expect(async () => {
      await act(() => {
        root.render(
          <div style={{borderStyle: 'dashed', borderLeft: '1px solid red'}} />,
        );
      });
    }).toErrorDev(
      'Updating a style property during rerender (borderStyle) ' +
        'when a conflicting property is set (borderLeft) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
    // But setting them  at the same time is OK:
    await act(() => {
      root.render(
        <div style={{borderStyle: 'dotted', borderLeft: '2px solid red'}} />,
      );
    });
    await expect(async () => {
      await act(() => {
        root.render(<div style={{borderStyle: 'dotted'}} />);
      });
    }).toErrorDev(
      'Removing a style property during rerender (borderLeft) ' +
        'when a conflicting property is set (borderStyle) can lead to ' +
        "styling bugs. To avoid this, don't mix shorthand and " +
        'non-shorthand properties for the same value; instead, replace the ' +
        'shorthand with separate values.' +
        '\n    in div (at **)',
    );
  });
});
