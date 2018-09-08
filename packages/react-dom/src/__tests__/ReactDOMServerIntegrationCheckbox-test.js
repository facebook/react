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

describe('ReactDOMServerIntegrationCheckbox', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders('a checkbox that is checked with an onChange', async render => {
    const e = await render(
      <input type="checkbox" checked={true} onChange={() => {}} />,
    );
    expect(e.checked).toBe(true);
  });

  itRenders('a checkbox that is checked with readOnly', async render => {
    const e = await render(
      <input type="checkbox" checked={true} readOnly={true} />,
    );
    expect(e.checked).toBe(true);
  });

  itRenders(
    'a checkbox that is checked and no onChange/readOnly',
    async render => {
      // this configuration should raise a dev warning that checked without
      // onChange or readOnly is a mistake.
      const e = await render(<input type="checkbox" checked={true} />, 1);
      expect(e.checked).toBe(true);
    },
  );

  itRenders('a checkbox with defaultChecked', async render => {
    const e = await render(<input type="checkbox" defaultChecked={true} />);
    expect(e.checked).toBe(true);
    expect(e.getAttribute('defaultChecked')).toBe(null);
  });

  itRenders('a checkbox checked overriding defaultChecked', async render => {
    const e = await render(
      <input
        type="checkbox"
        checked={true}
        defaultChecked={false}
        readOnly={true}
      />,
      1,
    );
    expect(e.checked).toBe(true);
    expect(e.getAttribute('defaultChecked')).toBe(null);
  });

  itRenders(
    'a checkbox checked overriding defaultChecked no matter the prop order',
    async render => {
      const e = await render(
        <input
          type="checkbox"
          defaultChecked={false}
          checked={true}
          readOnly={true}
        />,
        1,
      );
      expect(e.checked).toBe(true);
      expect(e.getAttribute('defaultChecked')).toBe(null);
    },
  );
});
