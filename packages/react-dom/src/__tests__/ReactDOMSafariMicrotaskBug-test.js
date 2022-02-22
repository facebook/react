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
let act;

describe('ReactDOMSafariMicrotaskBug-test', () => {
  let container;
  let simulateSafariBug;

  beforeEach(() => {
    // In Safari, microtasks don't always run on clean stack.
    // This setup crudely approximates it.
    // In reality, the sync flush happens when an iframe is added to the page.
    // https://github.com/facebook/react/issues/22459
    let queue = [];
    window.queueMicrotask = function(cb) {
      queue.push(cb);
    };
    simulateSafariBug = function() {
      queue.forEach(cb => cb());
      queue = [];
    };

    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    act = require('jest-react').act;

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should be resilient to buggy queueMicrotask', async () => {
    let ran = false;
    function Foo() {
      const [state, setState] = React.useState(0);
      return (
        <div
          ref={() => {
            if (!ran) {
              ran = true;
              setState(1);
              simulateSafariBug();
            }
          }}>
          {state}
        </div>
      );
    }
    const root = ReactDOM.createRoot(container);
    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toBe('1');
  });
});
