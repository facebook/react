/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let act;

describe('ReactEventIndependence', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
  });

  it('does not crash with other react inside', async () => {
    let clicks = 0;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    try {
      await act(() => {
        root.render(
          <div
            onClick={() => clicks++}
            dangerouslySetInnerHTML={{
              __html: '<button data-reactid=".z">click me</div>',
            }}
          />,
        );
      });

      container.firstElementChild.click();
      expect(clicks).toBe(1);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('does not crash with other react outside', async () => {
    let clicks = 0;
    const outer = document.createElement('div');
    document.body.appendChild(outer);
    const root = ReactDOMClient.createRoot(outer);
    try {
      outer.setAttribute('data-reactid', '.z');
      await act(() => {
        root.render(<button onClick={() => clicks++}>click me</button>);
      });
      outer.firstElementChild.click();
      expect(clicks).toBe(1);
    } finally {
      document.body.removeChild(outer);
    }
  });
});
