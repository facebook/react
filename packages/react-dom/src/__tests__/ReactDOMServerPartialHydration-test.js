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
let ReactDOMServer;
let ReactFeatureFlags;
let Suspense;

describe('ReactDOMServerPartialHydration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSuspenseServerRenderer = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Suspense = React.Suspense;
  });

  it('hydrates a parent even if a child Suspense boundary is blocked', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Resolving the promise should continue hydration
    suspend = false;
    resolve();
    await promise;
    jest.runAllTimers();

    // We should now have hydrated with a ref on the existing span.
    expect(ref.current).toBe(span);
  });

  it('can insert siblings before the dehydrated boundary', () => {
    let suspend = false;
    let promise = new Promise(() => {});
    let showSibling;

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Second';
      }
    }

    function Sibling() {
      let [visible, setVisibilty] = React.useState(false);
      showSibling = () => setVisibilty(true);
      if (visible) {
        return <div>First</div>;
      }
      return null;
    }

    function App() {
      return (
        <div>
          <Sibling />
          <Suspense fallback="Loading...">
            <span>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    ReactDOM.hydrate(<App />, container);

    expect(container.firstChild.firstChild.tagName).not.toBe('DIV');

    // In this state, we can still update the siblings.
    showSibling();

    expect(container.firstChild.firstChild.tagName).toBe('DIV');
    expect(container.firstChild.firstChild.textContent).toBe('First');
  });

  it('can delete the dehydrated boundary before it is hydrated', () => {
    let suspend = false;
    let promise = new Promise(() => {});
    let hideMiddle;

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return (
          <React.Fragment>
            <div>Middle</div>
            Some text
          </React.Fragment>
        );
      }
    }

    function App() {
      let [visible, setVisibilty] = React.useState(true);
      hideMiddle = () => setVisibilty(false);

      return (
        <div>
          <div>Before</div>
          {visible ? (
            <Suspense fallback="Loading...">
              <Child />
            </Suspense>
          ) : null}
          <div>After</div>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    ReactDOM.hydrate(<App />, container);

    expect(container.firstChild.children[1].textContent).toBe('Middle');

    // In this state, we can still delete the boundary.
    hideMiddle();

    expect(container.firstChild.children[1].textContent).toBe('After');
  });
});
