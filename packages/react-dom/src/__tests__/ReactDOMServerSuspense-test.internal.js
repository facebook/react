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

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();

  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableSuspenseServerRenderer = true;

  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const {resetModules, serverRender} = ReactDOMServerIntegrationUtils(
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
    const e = await serverRender(
      <React.Suspense fallback={<Text text="Fallback" />}>
        <Text text="Children" />
      </React.Suspense>,
    );

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Children');
  });

  it('should render the fallback when a promise thrown', async () => {
    const e = await serverRender(
      <React.Suspense fallback={<Text text="Fallback" />}>
        <AsyncText text="Children" />
      </React.Suspense>,
    );

    expect(e.tagName).toBe('DIV');
    expect(e.textContent).toBe('Fallback');
  });

  it('should work with nested suspense components', async () => {
    const e = await serverRender(
      <React.Suspense fallback={<Text text="Fallback" />}>
        <div>
          <Text text="Children" />
          <React.Suspense fallback={<Text text="Fallback" />}>
            <AsyncText text="Children" />
          </React.Suspense>
        </div>
      </React.Suspense>,
    );

    expect(e.innerHTML).toBe('<div>Children</div><div>Fallback</div>');
  });
});
