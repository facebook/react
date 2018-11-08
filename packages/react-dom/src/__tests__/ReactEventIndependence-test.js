/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('ReactEventIndependence', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('does not crash with other react inside', () => {
    let clicks = 0;
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const div = ReactDOM.render(
        <div
          onClick={() => clicks++}
          dangerouslySetInnerHTML={{
            __html: '<button data-reactid=".z">click me</div>',
          }}
        />,
        container,
      );

      div.firstChild.click();
      expect(clicks).toBe(1);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('does not crash with other react outside', () => {
    let clicks = 0;
    const outer = document.createElement('div');
    document.body.appendChild(outer);
    try {
      outer.setAttribute('data-reactid', '.z');
      const inner = ReactDOM.render(
        <button onClick={() => clicks++}>click me</button>,
        outer,
      );
      inner.click();
      expect(clicks).toBe(1);
    } finally {
      document.body.removeChild(outer);
    }
  });

  it('does not when event fired on unmounted tree', () => {
    let clicks = 0;
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const button = ReactDOM.render(
        <button onClick={() => clicks++}>click me</button>,
        container,
      );

      // Now we unmount the component, as if caused by a non-React event handler
      // for the same click we're about to simulate, like closing a layer:
      ReactDOM.unmountComponentAtNode(container);
      button.click();

      // Since the tree is unmounted, we don't dispatch the click event.
      expect(clicks).toBe(0);
    } finally {
      document.body.removeChild(container);
    }
  });
});
