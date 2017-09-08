/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

let React;
let ReactDOM;
let ReactFeatureFlags;

describe('ReactDOMAsyncRoot', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.enableAsyncSubtreeAPI = true;
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('works in easy mode', () => {
      const container = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<div>Foo</div>);
      expect(container.textContent).toEqual('Foo');
      root.render(<div>Bar</div>);
      expect(container.textContent).toEqual('Bar');
      root.unmount();
      expect(container.textContent).toEqual('');
    });

    it('can defer commit using prerender', () => {
      const Async = React.unstable_AsyncComponent;
      const container = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(container);
      const work = root.prerender(<Async>Foo</Async>);

      // Hasn't updated yet
      expect(container.textContent).toEqual('');

      work.then(() => {
        // Still hasn't updated
        expect(container.textContent).toEqual('');
        // Should synchronously commit
        work.commit();
        expect(container.textContent).toEqual('Foo');
      });

      jest.runAllTimers();
    });
  } else {
    it('does not apply to stack');
  }
});
