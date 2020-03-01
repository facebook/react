/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'dom-event-testing-library';

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;
let Scheduler;
let Suspense;

function dispatchMouseHoverEvent(to, from) {
  if (!to) {
    to = null;
  }
  if (!from) {
    from = null;
  }
  if (from) {
    const mouseOutEvent = document.createEvent('MouseEvents');
    mouseOutEvent.initMouseEvent(
      'mouseout',
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
      to,
    );
    from.dispatchEvent(mouseOutEvent);
  }
  if (to) {
    const mouseOverEvent = document.createEvent('MouseEvents');
    mouseOverEvent.initMouseEvent(
      'mouseover',
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
      from,
    );
    to.dispatchEvent(mouseOverEvent);
  }
}

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

    let ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
  });

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

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

    let root = ReactDOM.createRoot(container, {hydrate: true});
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
    let root = ReactDOM.createRoot(container, {hydrate: true});
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
    let root = ReactDOM.createRoot(container, {hydrate: true});
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

  if (__EXPERIMENTAL__) {
    it('hydrates the target boundary synchronously during a click (flare)', async () => {
      let usePress = require('react-interactions/events/press').usePress;

      function Child({text}) {
        Scheduler.unstable_yieldValue(text);
        const listener = usePress({
          onPress() {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          },
        });

        return <span DEPRECATED_flareListeners={listener}>{text}</span>;
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

      let root = ReactDOM.createRoot(container, {hydrate: true});
      root.render(<App />);

      // Nothing has been hydrated so far.
      expect(Scheduler).toHaveYielded([]);

      let span = container.getElementsByTagName('span')[1];

      let target = createEventTarget(span);

      // This should synchronously hydrate the root App and the second suspense
      // boundary.
      let preventDefault = jest.fn();
      target.virtualclick({preventDefault});

      // The event should have been canceled because we called preventDefault.
      expect(preventDefault).toHaveBeenCalled();

      // We rendered App, B and then invoked the event without rendering A.
      expect(Scheduler).toHaveYielded(['App', 'B', 'Clicked B']);

      // After continuing the scheduler, we finally hydrate A.
      expect(Scheduler).toFlushAndYield(['A']);

      document.body.removeChild(container);
    });

    it('hydrates at higher pri if sync did not work first time (flare)', async () => {
      let usePress = require('react-interactions/events/press').usePress;
      let suspend = false;
      let resolve;
      let promise = new Promise(resolvePromise => (resolve = resolvePromise));

      function Child({text}) {
        if ((text === 'A' || text === 'D') && suspend) {
          throw promise;
        }
        Scheduler.unstable_yieldValue(text);

        const listener = usePress({
          onPress() {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          },
        });
        return <span DEPRECATED_flareListeners={listener}>{text}</span>;
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
      let root = ReactDOM.createRoot(container, {hydrate: true});
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

    it('hydrates at higher pri for secondary discrete events (flare)', async () => {
      let usePress = require('react-interactions/events/press').usePress;
      let suspend = false;
      let resolve;
      let promise = new Promise(resolvePromise => (resolve = resolvePromise));

      function Child({text}) {
        if ((text === 'A' || text === 'D') && suspend) {
          throw promise;
        }
        Scheduler.unstable_yieldValue(text);

        const listener = usePress({
          onPress() {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          },
        });
        return <span DEPRECATED_flareListeners={listener}>{text}</span>;
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
      let root = ReactDOM.createRoot(container, {hydrate: true});
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
  }

  it('hydrates the hovered targets as higher priority for continuous events', async () => {
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
          }}
          onMouseEnter={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Hover ' + text);
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

    let spanB = container.getElementsByTagName('span')[1];
    let spanC = container.getElementsByTagName('span')[2];
    let spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    let root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Click D
    dispatchMouseHoverEvent(spanD, null);
    dispatchClickEvent(spanD);
    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);

    expect(Scheduler).toHaveYielded(['App']);

    suspend = false;
    resolve();
    await promise;

    // We should prioritize hydrating D first because we clicked it.
    // Next we should hydrate C since that's the current hover target.
    // To simplify implementation details we hydrate both B and C at
    // the same time since B was already scheduled.
    // This is ok because it will at least not continue for nested
    // boundary. See the next test below.
    expect(Scheduler).toFlushAndYield([
      'D',
      'Clicked D',
      'B', // Ideally this should be later.
      'C',
      'Hover C',
      'A',
    ]);

    document.body.removeChild(container);
  });

  it('hydrates the last target path first for continuous events', async () => {
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
          onMouseEnter={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Hover ' + text);
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
            <div>
              <Suspense fallback="Loading...">
                <Child text="B" />
              </Suspense>
            </div>
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

    let spanB = container.getElementsByTagName('span')[1];
    let spanC = container.getElementsByTagName('span')[2];
    let spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    let root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);

    suspend = false;
    resolve();
    await promise;

    // We should prioritize hydrating D first because we clicked it.
    // Next we should hydrate C since that's the current hover target.
    // Next it doesn't matter if we hydrate A or B first but as an
    // implementation detail we're currently hydrating B first since
    // we at one point hovered over it and we never deprioritized it.
    expect(Scheduler).toFlushAndYield(['App', 'C', 'Hover C', 'A', 'B', 'D']);

    document.body.removeChild(container);
  });

  it('hydrates the last explicitly hydrated target at higher priority', async () => {
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return <span>{text}</span>;
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
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C']);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let spanB = container.getElementsByTagName('span')[1];
    let spanC = container.getElementsByTagName('span')[2];

    let root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Increase priority of B and then C.
    ReactDOM.unstable_scheduleHydration(spanB);
    ReactDOM.unstable_scheduleHydration(spanC);

    // We should prioritize hydrating C first because the last added
    // gets highest priority followed by the next added.
    expect(Scheduler).toFlushAndYield(['App', 'C', 'B', 'A']);
  });

  it('hydrates before an update even if hydration moves away from it', async () => {
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return <span>{text}</span>;
    }
    let ChildWithBoundary = React.memo(function({text}) {
      return (
        <Suspense fallback="Loading...">
          <Child text={text} />
          <Child text={text.toLowerCase()} />
        </Suspense>
      );
    });

    function App({a}) {
      Scheduler.unstable_yieldValue('App');
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('Commit');
      });
      return (
        <div>
          <ChildWithBoundary text={a} />
          <ChildWithBoundary text="B" />
          <ChildWithBoundary text="C" />
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App a="A" />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'a', 'B', 'b', 'C', 'c']);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let spanA = container.getElementsByTagName('span')[0];
    let spanB = container.getElementsByTagName('span')[2];
    let spanC = container.getElementsByTagName('span')[4];

    let root = ReactDOM.createRoot(container, {hydrate: true});
    ReactTestUtils.act(() => {
      root.render(<App a="A" />);

      // Hydrate the shell.
      expect(Scheduler).toFlushAndYieldThrough(['App', 'Commit']);

      // Render an update at Idle priority that needs to update A.
      Scheduler.unstable_runWithPriority(
        Scheduler.unstable_IdlePriority,
        () => {
          root.render(<App a="AA" />);
        },
      );

      // Start rendering. This will force the first boundary to hydrate
      // by scheduling it at one higher pri than Idle.
      expect(Scheduler).toFlushAndYieldThrough(['App', 'A']);

      // Hover over A which (could) schedule at one higher pri than Idle.
      dispatchMouseHoverEvent(spanA, null);

      // Before, we're done we now switch to hover over B.
      // This is meant to test that this doesn't cause us to forget that
      // we still have to hydrate A. The first boundary.
      // This also tests that we don't do the -1 down-prioritization of
      // continuous hover events because that would decrease its priority
      // to Idle.
      dispatchMouseHoverEvent(spanB, spanA);

      // Also click C to prioritize that even higher which resets the
      // priority levels.
      dispatchClickEvent(spanC);

      expect(Scheduler).toHaveYielded([
        // Hydrate C first since we clicked it.
        'C',
        'c',
      ]);

      expect(Scheduler).toFlushAndYield([
        // Finish hydration of A since we forced it to hydrate.
        'A',
        'a',
        // Also, hydrate B since we hovered over it.
        // It's not important which one comes first. A or B.
        // As long as they both happen before the Idle update.
        'B',
        'b',
        // Begin the Idle update again.
        'App',
        'AA',
        'aa',
        'Commit',
      ]);
    });

    let spanA2 = container.getElementsByTagName('span')[0];
    // This is supposed to have been hydrated, not replaced.
    expect(spanA).toBe(spanA2);

    document.body.removeChild(container);
  });
});
