/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');
const React = require('react');

const TEXT_NODE_TYPE = 3;

const initModules = () => {
  // Reset warning cache.
  jest.resetModuleRegistry();

  // Make modules available to the helpers.
  return {
    ReactDOM: require('react-dom'),
    ReactDOMServer: require('react-dom/server'),
  };
};

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  describe('basic rendering', () => {
    itRenders('a blank div', async render => {
      const e = await render(<div />);
      expect(e.tagName).toBe('DIV');
    });

    itRenders('a self-closing tag', async render => {
      const e = await render(<br />);
      expect(e.tagName).toBe('BR');
    });

    itRenders('a self-closing tag as a child', async render => {
      const e = await render(<div><br /></div>);
      expect(e.childNodes.length).toBe(1);
      expect(e.firstChild.tagName).toBe('BR');
    });

    itRenders('a string', async render => {
      const e = await render('Hello');
      expect(e.nodeType).toBe(3);
      expect(e.nodeValue).toMatch('Hello');
    });

    itRenders('a number', async render => {
      const e = await render(42);
      expect(e.nodeType).toBe(3);
      expect(e.nodeValue).toMatch('42');
    });

    itRenders('an array with one child', async render => {
      const e = await render([<div key={1}>text1</div>]);
      const {childNodes} = e.parentNode;
      expect(childNodes[0].tagName).toBe('DIV');
    });

    itRenders('an array with several children', async render => {
      const Header = () => (<p>header</p>);
      const Footer = () => ([<h2 key={1}>footer</h2>, <h3 key={2}>about</h3>]);
      const e = await render([
        <div key={1}>text1</div>,
        <span key={2}>text2</span>,
        <Header key={3} />,
        <Footer key={4} />,
      ]);
      const {childNodes} = e.parentNode;
      expect(childNodes[0].tagName).toBe('DIV');
      expect(childNodes[1].tagName).toBe('SPAN');
      expect(childNodes[2].tagName).toBe('P');
      expect(childNodes[3].tagName).toBe('H2');
      expect(childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested array', async render => {
      const e = await render([
        [<div key={1}>text1</div>],
        <span key={1}>text2</span>,
        [[[null, <p key={1} />], false]],
      ]);
      const {childNodes} = e.parentNode;
      expect(childNodes[0].tagName).toBe('DIV');
      expect(childNodes[1].tagName).toBe('SPAN');
      expect(childNodes[2].tagName).toBe('P');
    });

    itRenders('an iterable', async render => {
      const threeDivIterable = {
        '@@iterator': () => {
          let i = 0;
          return {
            next: () => {
              if (i++ === 3) {
                return {value: undefined, done: true};
              }
              return {value: <div key={i} />, done: false};
            },
          };
        },
      };
      const e = await render(threeDivIterable);
      const {childNodes} = e.parentNode;
      expect(childNodes.length).toBe(3);
      expect(childNodes[0].tagName).toBe('DIV');
      expect(childNodes[1].tagName).toBe('DIV');
      expect(childNodes[2].tagName).toBe('DIV');
    });

    itRenders('emptyish values', async render => {
      const e = await render(0);
      expect(e.nodeType).toBe(TEXT_NODE_TYPE);
      expect(e.nodeValue).toMatch('0');

      // Empty string is special because client renders a node
      // but server returns empty HTML. So we compare parent text.
      expect((await render(<div>{''}</div>)).textContent).toBe('');

      expect(await render([])).toBe(null);
      expect(await render(false)).toBe(null);
      expect(await render(true)).toBe(null);
      expect(await render(undefined)).toBe(null);
      expect(await render([[[false]], undefined])).toBe(null);
    });
  });
});
