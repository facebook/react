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

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  describe('React.StrictMode', () => {
    itRenders('a strict mode with one child', async render => {
      let e = await render(
        <React.StrictMode>
          <div>text1</div>
        </React.StrictMode>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('a strict mode with several children', async render => {
      let Header = props => {
        return <p>header</p>;
      };
      let Footer = props => {
        return (
          <React.StrictMode>
            <h2>footer</h2>
            <h3>about</h3>
          </React.StrictMode>
        );
      };
      let e = await render(
        <React.StrictMode>
          <div>text1</div>
          <span>text2</span>
          <Header />
          <Footer />
        </React.StrictMode>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested strict mode', async render => {
      let e = await render(
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
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('an empty strict mode', async render => {
      expect(await render(<React.StrictMode />)).toBe(null);
    });
  });

  describe('React.unstable_AsyncMode', () => {
    itRenders('an async mode with one child', async render => {
      let e = await render(
        <React.unstable_AsyncMode>
          <div>text1</div>
        </React.unstable_AsyncMode>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('an async mode with several children', async render => {
      let Header = props => {
        return <p>header</p>;
      };
      let Footer = props => {
        return (
          <React.unstable_AsyncMode>
            <h2>footer</h2>
            <h3>about</h3>
          </React.unstable_AsyncMode>
        );
      };
      let e = await render(
        <React.unstable_AsyncMode>
          <div>text1</div>
          <span>text2</span>
          <Header />
          <Footer />
        </React.unstable_AsyncMode>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested async mode', async render => {
      let e = await render(
        <React.unstable_AsyncMode>
          <React.unstable_AsyncMode>
            <div>text1</div>
          </React.unstable_AsyncMode>
          <span>text2</span>
          <React.unstable_AsyncMode>
            <React.unstable_AsyncMode>
              <React.unstable_AsyncMode>
                {null}
                <p />
              </React.unstable_AsyncMode>
              {false}
            </React.unstable_AsyncMode>
          </React.unstable_AsyncMode>
        </React.unstable_AsyncMode>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('an empty async mode', async render => {
      expect(await render(<React.unstable_AsyncMode />)).toBe(null);
    });
  });
});
