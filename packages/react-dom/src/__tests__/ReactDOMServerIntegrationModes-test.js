/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  // Test pragmas don't support itRenders abstraction
  if (
    __EXPERIMENTAL__ &&
    require('shared/ReactFeatureFlags').enableDebugTracing
  ) {
    describe('React.unstable_DebugTracingMode', () => {
      beforeEach(() => {
        spyOnDevAndProd(console, 'log');
      });

      itRenders('with one child', async render => {
        const e = await render(
          <React.unstable_DebugTracingMode>
            <div>text1</div>
          </React.unstable_DebugTracingMode>,
        );
        const parent = e.parentNode;
        expect(parent.childNodes[0].tagName).toBe('DIV');
      });

      itRenders('mode with several children', async render => {
        const Header = props => {
          return <p>header</p>;
        };
        const Footer = props => {
          return (
            <React.unstable_DebugTracingMode>
              <h2>footer</h2>
              <h3>about</h3>
            </React.unstable_DebugTracingMode>
          );
        };
        const e = await render(
          <React.unstable_DebugTracingMode>
            <div>text1</div>
            <span>text2</span>
            <Header />
            <Footer />
          </React.unstable_DebugTracingMode>,
        );
        const parent = e.parentNode;
        expect(parent.childNodes[0].tagName).toBe('DIV');
        expect(parent.childNodes[1].tagName).toBe('SPAN');
        expect(parent.childNodes[2].tagName).toBe('P');
        expect(parent.childNodes[3].tagName).toBe('H2');
        expect(parent.childNodes[4].tagName).toBe('H3');
      });
    });
  }

  describe('React.StrictMode', () => {
    itRenders('a strict mode with one child', async render => {
      const e = await render(
        <React.StrictMode>
          <div>text1</div>
        </React.StrictMode>,
      );
      const parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('a strict mode with several children', async render => {
      const Header = props => {
        return <p>header</p>;
      };
      const Footer = props => {
        return (
          <React.StrictMode>
            <h2>footer</h2>
            <h3>about</h3>
          </React.StrictMode>
        );
      };
      const e = await render(
        <React.StrictMode>
          <div>text1</div>
          <span>text2</span>
          <Header />
          <Footer />
        </React.StrictMode>,
      );
      const parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested strict mode', async render => {
      const e = await render(
        <React.StrictMode>
          <React.StrictMode>
            <div>text1</div>
          </React.StrictMode>
          <span>text2</span>
          <React.StrictMode>
            <React.StrictMode>
              <React.StrictMode>
                {null}
                <p />
              </React.StrictMode>
              {false}
            </React.StrictMode>
          </React.StrictMode>
        </React.StrictMode>,
      );
      const parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('an empty strict mode', async render => {
      expect(await render(<React.StrictMode />)).toBe(null);
    });
  });
});
