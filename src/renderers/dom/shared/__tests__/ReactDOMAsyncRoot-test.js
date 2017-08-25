/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactFeatureFlags;

describe('ReactDOMAsyncMount', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.enableAsyncSubtreeAPI = true;
  });

  it('works in easy mode', () => {
    const container = document.createElement('div');
    const root = ReactDOM.unstable_create(container);
    root.render(<div>Foo</div>);
    expect(container.textContent).toEqual('Foo');
    root.render(<div>Bar</div>);
    expect(container.textContent).toEqual('Bar');
    root.unmount();
    expect(container.textContent).toEqual('');
  });

  it('can pass callback to render', () => {
    const container = document.createElement('div');
    const root = ReactDOM.unstable_create(container);
    let called = false;
    root.render(<div>Foo</div>, () => {
      called = true;
    });
    expect(container.textContent).toEqual('Foo');
    expect(called).toBe(true);
  });

  it('can await result of render method', async () => {
    const container = document.createElement('div');
    const root = ReactDOM.unstable_create(container);
    await root.render(<div>Foo</div>);
    expect(container.textContent).toEqual('Foo');
  });

  it('can defer commit using prerender', async () => {
    const Async = React.unstable_AsyncComponent;
    const container = document.createElement('div');
    const root = ReactDOM.unstable_create(container);
    const work = root.prerender(<Async>Foo</Async>);

    // Hasn't updated yet
    expect(container.textContent).toEqual('');

    await work;

    // Tree has completed, but still hasn't updated yet
    expect(container.textContent).toEqual('');

    // Synchronsouly update DOM
    work.commit();
    expect(container.textContent).toEqual('Foo');
  });
});
