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

  it('should always render the fallback when a placeholder is encountered', async () => {
    const Suspended = props => {
      throw new Promise(() => {});
    };
    const e = await serverRender(
      <React.Suspense fallback={<div />}>
        <Suspended />
      </React.Suspense>,
    );

    expect(e.tagName).toBe('DIV');
  });
});
