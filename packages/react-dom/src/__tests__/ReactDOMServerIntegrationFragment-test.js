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

  describe('React.Fragment', () => {
    itRenders('a fragment with one child', async render => {
      let e = await render(
        <React.Fragment>
          <div>text1</div>
        </React.Fragment>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('a fragment with several children', async render => {
      let Header = props => {
        return <p>header</p>;
      };
      let Footer = props => {
        return (
          <React.Fragment>
            <h2>footer</h2>
            <h3>about</h3>
          </React.Fragment>
        );
      };
      let e = await render(
        <React.Fragment>
          <div>text1</div>
          <span>text2</span>
          <Header />
          <Footer />
        </React.Fragment>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested fragment', async render => {
      let e = await render(
        <React.Fragment>
          <React.Fragment>
            <div>text1</div>
          </React.Fragment>
          <span>text2</span>
          <React.Fragment>
            <React.Fragment>
              <React.Fragment>
                {null}
                <p />
              </React.Fragment>
              {false}
            </React.Fragment>
          </React.Fragment>
        </React.Fragment>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('an empty fragment', async render => {
      expect(await render(<React.Fragment />)).toBe(null);
    });
  });
});
