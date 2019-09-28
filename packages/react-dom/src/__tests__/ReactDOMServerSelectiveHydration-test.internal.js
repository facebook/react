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
let Scheduler;
let ReactFeatureFlags;
let Suspense;

function dispatchClickEvent(target) {
  const mouseOutEvent = document.createEvent('MouseEvents');
  mouseOutEvent.initMouseEvent(
    'click',
    true,
    true,
    window,
    0,
    50,
    50,
    50,
    50,
    false,
    false,
    false,
    false,
    0,
    target,
  );
  return target.dispatchEvent(mouseOutEvent);
}

describe('ReactDOMServerSelectiveHydration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSuspenseServerRenderer = true;
    ReactFeatureFlags.enableSelectiveHydration = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
  });

  it('hydrates the target boundary synchronously during a click', async () => {
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return (
        <span
          onClick={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Clicked ' + text);
          }}>
          {text}
        </span>
      );
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child text="A" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="B" />
          </Suspense>
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B']);

    let container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[1];

    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This should synchronously hydrate the root App and the second suspense
    // boundary.
    let result = dispatchClickEvent(span);

    // The event should have been canceled because we called preventDefault.
    expect(result).toBe(false);

    // We rendered App, B and then invoked the event without rendering A.
    expect(Scheduler).toHaveYielded(['App', 'B', 'Clicked B']);

    // After continuing the scheduler, we finally hydrate A.
    expect(Scheduler).toFlushAndYield(['A']);

    document.body.removeChild(container);
  });

  it('hydrates at higher pri if sync did not work first time', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Child({text}) {
      if ((text === 'A' || text === 'D') && suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue(text);
      return (
        <span
          onClick={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Clicked ' + text);
          }}>
          {text}
        </span>
      );
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child text="A" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="B" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="C" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="D" />
          </Suspense>
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    let container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    let spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because it's suspended.
    let result = dispatchClickEvent(spanD);

    expect(Scheduler).toHaveYielded(['App']);

    expect(result).toBe(true);

    // Continuing rendering will render B next.
    expect(Scheduler).toFlushAndYield(['B', 'C']);

    suspend = false;
    resolve();
    await promise;

    // After the click, we should prioritize D and the Click first,
    // and only after that render A and C.
    expect(Scheduler).toFlushAndYield(['D', 'Clicked D', 'A']);

    document.body.removeChild(container);
  });

  it('hydrates at higher pri for secondary discrete events', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Child({text}) {
      if ((text === 'A' || text === 'D') && suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue(text);
      return (
        <span
          onClick={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Clicked ' + text);
          }}>
          {text}
        </span>
      );
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child text="A" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="B" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="C" />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child text="D" />
          </Suspense>
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    let container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    let spanA = container.getElementsByTagName('span')[0];
    let spanC = container.getElementsByTagName('span')[2];
    let spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because the first is Suspended.
    dispatchClickEvent(spanA);
    dispatchClickEvent(spanC);
    dispatchClickEvent(spanD);

    expect(Scheduler).toHaveYielded(['App']);

    suspend = false;
    resolve();
    await promise;

    // We should prioritize hydrating A, C and D first since we clicked in
    // them. Only after they're done will we hydrate B.
    expect(Scheduler).toFlushAndYield([
      'A',
      'Clicked A',
      'C',
      'Clicked C',
      'D',
      'Clicked D',
      // B should render last since it wasn't clicked.
      'B',
    ]);

    document.body.removeChild(container);
  });
});
