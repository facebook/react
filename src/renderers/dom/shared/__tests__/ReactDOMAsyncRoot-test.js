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
let ReactDOMServer;
let ReactFeatureFlags;

describe('ReactDOMAsyncRoot', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
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

      let ops = [];
      work.then(() => {
        // Still hasn't updated
        ops.push(container.textContent);
        // Should synchronously commit
        work.commit();
        ops.push(container.textContent);
      });
      // Flush async work
      jest.runAllTimers();
      expect(ops).toEqual(['', 'Foo']);
    });

    it('resolves `then` callback synchronously if update is sync', () => {
      const container = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(container);
      const work = root.prerender(<div>Hi</div>);

      let ops = [];
      work.then(() => {
        work.commit();
        ops.push(container.textContent);
        expect(container.textContent).toEqual('Hi');
      });
      // `then` should have synchronously resolved
      expect(ops).toEqual(['Hi']);
    });

    it('supports hydration', async () => {
      const markup = await new Promise(resolve =>
        resolve(
          ReactDOMServer.renderToString(<div><span className="extra" /></div>),
        ),
      );

      spyOn(console, 'error');

      // Does not hydrate by default
      const container1 = document.createElement('div');
      container1.innerHTML = markup;
      const root1 = ReactDOM.unstable_createRoot(container1);
      root1.render(<div><span /></div>);
      expect(console.error.calls.count()).toBe(0);

      // Accepts `hydrate` option
      const container2 = document.createElement('div');
      container2.innerHTML = markup;
      const root2 = ReactDOM.unstable_createRoot(container2, {hydrate: true});
      root2.render(<div><span /></div>);
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toMatch('Extra attributes');
    });

    it('supports lazy containers', () => {
      let ops = [];
      function Foo(props) {
        ops.push('Foo');
        return props.children;
      }

      let container;
      const root = ReactDOM.unstable_createLazyRoot(() => container);
      const work = root.prerender(<Foo>Hi</Foo>);
      expect(ops).toEqual(['Foo']);

      // Set container
      container = document.createElement('div');

      ops = [];

      work.commit();
      expect(container.textContent).toEqual('Hi');
      // Should not have re-rendered Foo
      expect(ops).toEqual([]);
    });

    it('can specify namespace of a lazy container', () => {
      const namespace = 'http://www.w3.org/2000/svg';

      let container;
      const root = ReactDOM.unstable_createLazyRoot(() => container, {
        namespace,
      });
      const work = root.prerender(<path />);

      // Set container
      container = document.createElementNS(namespace, 'svg');
      work.commit();
      // Child should have svg namespace
      expect(container.firstChild.namespaceURI).toBe(namespace);
    });
  } else {
    it('does not apply to stack');
  }
});
