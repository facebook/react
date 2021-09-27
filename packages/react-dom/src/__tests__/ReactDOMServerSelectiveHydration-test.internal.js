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
let Scheduler;
let Suspense;
let act;

let IdleEventPriority;

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

// TODO: There's currently no React DOM API to opt into Idle priority updates,
// and there's no native DOM event that maps to idle priority, so this is a
// temporary workaround. Need something like ReactDOM.unstable_IdleUpdates.
function TODO_scheduleIdleDOMSchedulerTask(fn) {
  ReactDOM.unstable_runWithPriority(IdleEventPriority, () => {
    const prevEvent = window.event;
    window.event = {type: 'message'};
    try {
      fn();
    } finally {
      window.event = prevEvent;
    }
  });
}

describe('ReactDOMServerSelectiveHydration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableCreateEventHandleAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    act = require('jest-react').act;
    Scheduler = require('scheduler');
    Suspense = React.Suspense;

    IdleEventPriority = require('react-reconciler/constants').IdleEventPriority;
  });

  it('hydrates the target boundary synchronously during a click', async () => {
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return (
        <span
          onClickCapture={() => {
            Scheduler.unstable_yieldValue('Capture Clicked ' + text);
          }}
          onClick={e => {
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[1];

    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This should synchronously hydrate the root App and the second suspense
    // boundary.
    dispatchClickEvent(span);

    // We rendered App, B and then invoked the event without rendering A.
    expect(Scheduler).toHaveYielded([
      'App',
      'B',
      'Capture Clicked B',
      'Clicked B',
    ]);

    // After continuing the scheduler, we finally hydrate A.
    expect(Scheduler).toFlushAndYield(['A']);

    document.body.removeChild(container);
  });

  it('hydrates at higher pri if sync did not work first time', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because it's suspended.
    await act(async () => {
      const result = dispatchClickEvent(spanD);
      expect(result).toBe(true);
    });
    expect(Scheduler).toHaveYielded([
      'App',
      // B and C don't suspense so they are rendered immediately
      'B',
      'C',
    ]);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });
    // After the click, we should prioritize hydrating D
    // and only after that render A and C.
    expect(Scheduler).toHaveYielded(['D', 'A']);

    document.body.removeChild(container);
  });

  it('hydrates at higher pri for secondary discrete events', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanA = container.getElementsByTagName('span')[0];
    const spanC = container.getElementsByTagName('span')[2];
    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // A and D cannot be hydrated yet because they Suspended.
    dispatchClickEvent(spanA);
    dispatchClickEvent(spanD);

    // C can be immediately hydrated in capture phase in time for it to be clicked
    dispatchClickEvent(spanC);
    expect(Scheduler).toHaveYielded(['App', 'C', 'Clicked C']);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    // We should prioritize hydrating A then D first since we clicked in
    // them. Only after they're done will we hydrate B.
    expect(Scheduler).toHaveYielded([
      'A',
      'D',
      // B should render last since it wasn't clicked.
      'B',
    ]);

    document.body.removeChild(container);
  });

  // @gate www
  it('hydrates the target boundary synchronously during a click (createEventHandle)', async () => {
    const setClick = ReactDOM.unstable_createEventHandle('click');
    let isServerRendering = true;

    function Child({text}) {
      const ref = React.useRef(null);
      Scheduler.unstable_yieldValue(text);
      if (!isServerRendering) {
        React.useLayoutEffect(() => {
          return setClick(ref.current, () => {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          });
        });
      }

      return <span ref={ref}>{text}</span>;
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    isServerRendering = false;

    const root = ReactDOM.createRoot(container, {hydrate: true});

    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    const span = container.getElementsByTagName('span')[1];

    const target = createEventTarget(span);

    // This should synchronously hydrate the root App and the second suspense
    // boundary.
    target.virtualclick();

    // We rendered App, B and then invoked the event without rendering A.
    expect(Scheduler).toHaveYielded(['App', 'B', 'Clicked B']);

    // After continuing the scheduler, we finally hydrate A.
    expect(Scheduler).toFlushAndYield(['A']);

    document.body.removeChild(container);
  });

  // @gate www
  it('hydrates at higher pri if sync did not work first time (createEventHandle)', async () => {
    let suspend = false;
    let isServerRendering = true;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const setClick = ReactDOM.unstable_createEventHandle('click');

    function Child({text}) {
      const ref = React.useRef(null);
      if ((text === 'A' || text === 'D') && suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue(text);

      if (!isServerRendering) {
        React.useLayoutEffect(() => {
          return setClick(ref.current, () => {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          });
        });
      }

      return <span ref={ref}>{text}</span>;
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;
    isServerRendering = false;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Continuing rendering will render B next.
    await act(async () => {
      const target = createEventTarget(spanD);
      target.virtualclick();
    });
    expect(Scheduler).toHaveYielded(['App', 'B', 'C']);

    // After the click, we should prioritize D,
    // and only after that render A
    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });
    // No click is yielded since we don't replay clicks
    expect(Scheduler).toHaveYielded(['D', 'A']);

    document.body.removeChild(container);
  });

  // @gate www
  it('hydrates at higher pri for secondary discrete events (createEventHandle)', async () => {
    const setClick = ReactDOM.unstable_createEventHandle('click');
    let suspend = false;
    let isServerRendering = true;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Child({text}) {
      const ref = React.useRef(null);
      if ((text === 'A' || text === 'D') && suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue(text);

      if (!isServerRendering) {
        React.useLayoutEffect(() => {
          return setClick(ref.current, () => {
            Scheduler.unstable_yieldValue('Clicked ' + text);
          });
        });
      }
      return <span ref={ref}>{text}</span>;
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanA = container.getElementsByTagName('span')[0];
    const spanC = container.getElementsByTagName('span')[2];
    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;
    isServerRendering = false;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because the first is Suspended.
    createEventTarget(spanA).virtualclick();
    createEventTarget(spanD).virtualclick();

    // C can be immediately hydrated in capture phase in time for click
    createEventTarget(spanC).virtualclick();

    expect(Scheduler).toHaveYielded(['App', 'C', 'Clicked C']);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    // We should prioritize hydrating A, C and D first since we clicked in
    // them. Only after they're done will we hydrate B.
    expect(Scheduler).toHaveYielded([
      'A',
      'D',
      // B should render last since it wasn't clicked.
      'B',
    ]);

    document.body.removeChild(container);
  });

  it('hydrates the hovered targets as higher priority for continuous events', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanB = container.getElementsByTagName('span')[1];
    const spanC = container.getElementsByTagName('span')[2];
    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Click D
    dispatchMouseHoverEvent(spanD, null);
    dispatchClickEvent(spanD);
    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);

    // We can hydrate B and C now.
    expect(Scheduler).toHaveYielded(['App', 'B', 'C']);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    // We should prioritize hydrating D first because we clicked it.
    // Next we should hydrate C since that's the current hover target.
    // To simplify implementation details we hydrate both B and C at
    // the same time since B was already scheduled.
    // This is ok because it will at least not continue for nested
    // boundary. See the next test below.
    expect(Scheduler).toHaveYielded(['D', 'A']);

    document.body.removeChild(container);
  });

  it('hydrates the last target path first for continuous events', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C', 'D']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const spanB = container.getElementsByTagName('span')[1];
    const spanC = container.getElementsByTagName('span')[2];
    const spanD = container.getElementsByTagName('span')[3];

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    // C renders before B since its the current hover target
    // B renders because its priority was increased when it was hovered over
    expect(Scheduler).toHaveYielded(['App', 'C', 'B', 'Hover C', 'D', 'A']);

    // We should prioritize hydrating D first because we clicked it.
    // Next we should hydrate C since that's the current hover target.
    // Next it doesn't matter if we hydrate A or B first but as an
    // implementation detail we're currently hydrating B first since
    // we at one point hovered over it and we never deprioritized it.
    expect(Scheduler).toFlushAndYield([]);

    document.body.removeChild(container);
  });

  // @gate experimental || www
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C']);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const spanB = container.getElementsByTagName('span')[1];
    const spanC = container.getElementsByTagName('span')[2];

    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental || www
  it('hydrates before an update even if hydration moves away from it', async () => {
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      return <span>{text}</span>;
    }
    const ChildWithBoundary = React.memo(function({text}) {
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

    const finalHTML = ReactDOMServer.renderToString(<App a="A" />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'a', 'B', 'b', 'C', 'c']);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const spanA = container.getElementsByTagName('span')[0];
    const spanB = container.getElementsByTagName('span')[2];
    const spanC = container.getElementsByTagName('span')[4];

    const root = ReactDOM.createRoot(container, {hydrate: true});
    act(() => {
      root.render(<App a="A" />);

      // Hydrate the shell.
      expect(Scheduler).toFlushAndYieldThrough(['App', 'Commit']);

      // Render an update at Idle priority that needs to update A.

      TODO_scheduleIdleDOMSchedulerTask(() => {
        root.render(<App a="AA" />);
      });

      // Start rendering. This will force the first boundary to hydrate
      // by scheduling it at one higher pri than Idle.
      expect(Scheduler).toFlushAndYieldThrough([
        // An update was scheduled to force hydrate the boundary, but React will
        // continue rendering at Idle until the next time React yields. This is
        // fine though because it will switch to the hydration level when it
        // re-enters the work loop.
        'App',
        'AA',
      ]);

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
        // Hydrate A and B since we hovered
        // then Hydrate C since we clicked it.
        'A',
        'a',
        'B',
        'b',
        'C',
        'c',
      ]);

      expect(Scheduler).toFlushAndYield([
        // Begin the Idle update again.
        'App',
        'AA',
        'aa',
        'Commit',
      ]);
    });

    const spanA2 = container.getElementsByTagName('span')[0];
    // This is supposed to have been hydrated, not replaced.
    expect(spanA).toBe(spanA2);

    document.body.removeChild(container);
  });
});
