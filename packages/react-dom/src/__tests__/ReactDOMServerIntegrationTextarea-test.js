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

describe('ReactDOMServerIntegrationTextareas', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders('a textarea with a value and an onChange', async render => {
    const e = await render(<textarea value="foo" onChange={() => {}} />);
    // textarea DOM elements don't have a value **attribute**, the text is
    // a child of the element and accessible via the .value **property**.
    expect(e.getAttribute('value')).toBe(null);
    expect(e.value).toBe('foo');
  });

  itRenders('a textarea with a value and readOnly', async render => {
    const e = await render(<textarea value="foo" readOnly={true} />);
    // textarea DOM elements don't have a value **attribute**, the text is
    // a child of the element and accessible via the .value **property**.
    expect(e.getAttribute('value')).toBe(null);
    expect(e.value).toBe('foo');
  });

  itRenders(
    'a textarea with a value and no onChange/readOnly',
    async render => {
      // this configuration should raise a dev warning that value without
      // onChange or readOnly is a mistake.
      const e = await render(<textarea value="foo" />, 1);
      expect(e.getAttribute('value')).toBe(null);
      expect(e.value).toBe('foo');
    },
  );

  itRenders('a textarea with a defaultValue', async render => {
    const e = await render(<textarea defaultValue="foo" />);
    expect(e.getAttribute('value')).toBe(null);
    expect(e.getAttribute('defaultValue')).toBe(null);
    expect(e.value).toBe('foo');
  });

  itRenders('a textarea value overriding defaultValue', async render => {
    const e = await render(
      <textarea value="foo" defaultValue="bar" readOnly={true} />,
      1,
    );
    expect(e.getAttribute('value')).toBe(null);
    expect(e.getAttribute('defaultValue')).toBe(null);
    expect(e.value).toBe('foo');
  });

  itRenders(
    'a textarea value overriding defaultValue no matter the prop order',
    async render => {
      const e = await render(
        <textarea defaultValue="bar" value="foo" readOnly={true} />,
        1,
      );
      expect(e.getAttribute('value')).toBe(null);
      expect(e.getAttribute('defaultValue')).toBe(null);
      expect(e.value).toBe('foo');
    },
  );

  itRenders('a textarea with Symbol value with a warning', async render => {
    const e = await render(
      <textarea value={Symbol('test')} readOnly={true} />,
      1,
    );
    expect(e.value).toBe('');
  });

  itRenders(
    'a textarea with Symbol defaultValue with a warning',
    async render => {
      const e = await render(
        <textarea defaultValue={Symbol('test')} readOnly={true} />,
        1,
      );
      expect(e.value).toBe('');
    },
  );

  itRenders('a textarea with NaN value with a warning', async render => {
    const e = await render(<textarea value={NaN} readOnly={true} />, 1);
    expect(e.value).toBe('NaN');
  });

  itRenders('a textarea with NaN defaultValue with a warning', async render => {
    const e = await render(<textarea defaultValue={NaN} readOnly={true} />, 1);
    expect(e.value).toBe('NaN');
  });

  itRenders('a textarea with function value with a warning', async render => {
    const e = await render(<textarea value={() => {}} readOnly={true} />, 1);
    expect(e.value).toBe('');
  });

  itRenders(
    'a textarea with function defaultValue with a warning',
    async render => {
      const e = await render(
        <textarea defaultValue={() => {}} readOnly={true} />,
        1,
      );
      expect(e.value).toBe('');
    },
  );

  itRenders('a textarea with Object value with a warning', async render => {
    const value = {
      toString() {
        return 'result of toString()';
      },
    };

    const e = await render(<textarea value={value} readOnly={true} />, 0);

    expect(e.value).toBe('result of toString()');
  });

  itRenders('a textarea with true value with a warning', async render => {
    const e = await render(<textarea value={true} readOnly={true} />, 0);
    expect(e.value).toBe('true');
  });

  itRenders('a textarea with false value with a warning', async render => {
    const e = await render(<textarea value={false} readOnly={true} />, 0);
    expect(e.value).toBe('false');
  });
});
