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
let ReactFeatureFlags;
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();

  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableSuspenseServerRenderer = true;

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

const {resetModules, serverRender, itRenders} = ReactDOMServerIntegrationUtils(
  initModules,
);

describe('ReactDOMServerSuspense', () => {
  beforeEach(() => {
    resetModules();
  });

  function Text(props) {
    return <div>{props.text}</div>;
  }

  function AsyncText(props) {
    throw new Promise(() => {});
  }

  it('should render the children when no promise is thrown', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <Text text="Children" />
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Children');
  });

  it('should render the fallback when a promise thrown', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <AsyncText text="Children" />
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Fallback');
  });

  it('should work with nested suspense components', async () => {
    const c = await serverRender(
      <div>
        <React.Suspense fallback={<Text text="Fallback" />}>
          <div>
            <Text text="Children" />
            <React.Suspense fallback={<Text text="Fallback" />}>
              <AsyncText text="Children" />
            </React.Suspense>
          </div>
        </React.Suspense>
      </div>,
    );
    const e = c.children[0];

    expect(e.innerHTML).toBe(
      '<div>Children</div><!--$!--><div>Fallback</div><!--/$-->',
    );
  });

  itRenders('a SuspenseList component and its children', async render => {
    const element = await render(
      <React.unstable_SuspenseList>
        <React.Suspense fallback="Loading A">
          <div>A</div>
        </React.Suspense>
        <React.Suspense fallback="Loading B">
          <div>B</div>
        </React.Suspense>
      </React.unstable_SuspenseList>,
    );
    const parent = element.parentNode;
    const divA = parent.children[0];
    expect(divA.tagName).toBe('DIV');
    expect(divA.textContent).toBe('A');
    const divB = parent.children[1];
    expect(divB.tagName).toBe('DIV');
    expect(divB.textContent).toBe('B');
  });
});
