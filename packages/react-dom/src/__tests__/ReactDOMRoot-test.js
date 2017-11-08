/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

require('shared/ReactFeatureFlags').enableCreateRoot = true;
var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMServer = require('react-dom/server');

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
  });

  it('unmounts children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    expect(container.textContent).toEqual('');
  });

  it('supports hydration', async () => {
    const markup = await new Promise(resolve =>
      resolve(
        ReactDOMServer.renderToString(
          <div>
            <span className="extra" />
          </div>,
        ),
      ),
    );

    spyOn(console, 'error');

    // Does not hydrate by default
    const container1 = document.createElement('div');
    container1.innerHTML = markup;
    const root1 = ReactDOM.createRoot(container1);
    root1.render(
      <div>
        <span />
      </div>,
    );
    expect(console.error.calls.count()).toBe(0);

    // Accepts `hydrate` option
    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    const root2 = ReactDOM.createRoot(container2, {hydrate: true});
    root2.render(
      <div>
        <span />
      </div>,
    );
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toMatch('Extra attributes');
  });

  it('does not clear existing children', async () => {
    spyOn(console, 'error');
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOM.createRoot(container);
    root.render(
      <div>
        <span>c</span>
        <span>d</span>
      </div>,
    );
    expect(container.textContent).toEqual('abcd');
    root.render(
      <div>
        <span>d</span>
        <span>c</span>
      </div>,
    );
    expect(container.textContent).toEqual('abdc');
  });
});
