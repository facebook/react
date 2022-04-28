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

let ReactDOMClient;
let act;

describe('ReactDOMSafariMicrotaskBug-test', () => {
  let container;
  let flushMicrotasksPrematurely;

  beforeEach(() => {
    // In Safari, microtasks don't always run on clean stack.
    // This setup crudely approximates it.
    // In reality, the sync flush happens when an iframe is added to the page.
    // https://github.com/facebook/react/issues/22459
    let queue = [];
    window.queueMicrotask = function(cb) {
      queue.push(cb);
    };
    flushMicrotasksPrematurely = function() {
      while (queue.length > 0) {
        const prevQueue = queue;
        queue = [];
        prevQueue.forEach(cb => cb());
      }
    };

    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('jest-react').act;

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should deal with premature microtask in commit phase', async () => {
    let ran = false;
    function Foo() {
      const [state, setState] = React.useState(0);
      return (
        <div
          ref={() => {
            if (!ran) {
              ran = true;
              setState(1);
              flushMicrotasksPrematurely();
            }
          }}>
          {state}
        </div>
      );
    }
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toBe('1');
  });

  it('should deal with premature microtask in event handler', async () => {
    function Foo() {
      const [state, setState] = React.useState(0);
      return (
        <button
          onClick={() => {
            setState(1);
            flushMicrotasksPrematurely();
          }}>
          {state}
        </button>
      );
    }
    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toBe('0');
    await act(async () => {
      container.firstChild.dispatchEvent(
        new MouseEvent('click', {bubbles: true}),
      );
    });
    expect(container.textContent).toBe('1');
  });
});
