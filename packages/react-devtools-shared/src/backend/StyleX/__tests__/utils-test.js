/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('Stylex plugin utils', () => {
  let getStyleXValues;
  let styleElements;

  function defineStyles(style) {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(style));

    styleElements.push(styleElement);

    document.head.appendChild(styleElement);
  }

  beforeEach(() => {
    getStyleXValues = require('../utils').getStyleXValues;

    styleElements = [];
  });

  afterEach(() => {
    styleElements.forEach(styleElement => {
      document.head.removeChild(styleElement);
    });
  });

  it('should support simple style objects', () => {
    defineStyles(`
      .foo {
        display: flex;
      }
      .bar: {
        align-items: center;
      }
      .baz {
        flex-direction: center;
      }
    `);

    expect(
      getStyleXValues({
        display: 'foo',
        flexDirection: 'baz',
        alignItems: 'bar',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "alignItems": "center",
        "display": "flex",
        "flexDirection": "center",
      }
    `);
  });

  it('should support multiple style objects', () => {
    defineStyles(`
      .foo {
        display: flex;
      }
      .bar: {
        align-items: center;
      }
      .baz {
        flex-direction: center;
      }
    `);

    expect(
      getStyleXValues([
        {display: 'foo'},
        {flexDirection: 'baz', alignItems: 'bar'},
      ]),
    ).toMatchInlineSnapshot(`
      Object {
        "alignItems": "center",
        "display": "flex",
        "flexDirection": "center",
      }
    `);
  });

  it('should filter empty rules', () => {
    defineStyles(`
      .foo {
        display: flex;
      }
      .bar: {
        align-items: center;
      }
      .baz {
        flex-direction: center;
      }
    `);

    expect(
      getStyleXValues([
        false,
        {display: 'foo'},
        false,
        false,
        {flexDirection: 'baz', alignItems: 'bar'},
        false,
      ]),
    ).toMatchInlineSnapshot(`
      Object {
        "alignItems": "center",
        "display": "flex",
        "flexDirection": "center",
      }
    `);
  });

  it('should support pseudo-classes', () => {
    defineStyles(`
      .foo {
        color: black;
      }
      .bar: {
        color: blue;
      }
      .baz {
        text-decoration: none;
      }
    `);

    expect(
      getStyleXValues({
        color: 'foo',
        ':hover': {
          color: 'bar',
          textDecoration: 'baz',
        },
      }),
    ).toMatchInlineSnapshot(`
      Object {
        ":hover": Object {
          "color": "blue",
          "textDecoration": "none",
        },
        "color": "black",
      }
    `);
  });

  it('should support nested selectors', () => {
    defineStyles(`
      .foo {
        display: flex;
      }
      .bar: {
        align-items: center;
      }
      .baz {
        flex-direction: center;
      }
    `);

    expect(
      getStyleXValues([
        {display: 'foo'},
        false,
        [false, {flexDirection: 'baz'}, {alignItems: 'bar'}],
        false,
      ]),
    ).toMatchInlineSnapshot(`
      Object {
        "alignItems": "center",
        "display": "flex",
        "flexDirection": "center",
      }
    `);
  });
});
