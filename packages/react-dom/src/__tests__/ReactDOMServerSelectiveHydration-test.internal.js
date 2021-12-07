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
let ReactFeatureFlags;
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

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[1];

    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This should synchronously hydrate the root App and the second suspense
    // boundary.
    const result = dispatchClickEvent(span);

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
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because it's suspended.
    await act(async () => {
      const result = dispatchClickEvent(spanD);
      expect(result).toBe(true);
    });
    expect(Scheduler).toHaveYielded([
      'App',
      // Continuing rendering will render B next.
      'B',
      'C',
    ]);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    if (
      gate(
        flags =>
          flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
      )
    ) {
      expect(Scheduler).toHaveYielded(['D', 'A']);
    } else {
      // After the click, we should prioritize D and the Click first,
      // and only after that render A and C.
      expect(Scheduler).toHaveYielded(['D', 'Clicked D', 'A']);
    }

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
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because the first is Suspended.
    dispatchClickEvent(spanA);
    dispatchClickEvent(spanC);
    dispatchClickEvent(spanD);

    if (
      gate(
        flags =>
          flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
      )
    ) {
      expect(Scheduler).toHaveYielded(['App', 'C', 'Clicked C']);
    } else {
      expect(Scheduler).toHaveYielded(['App']);
    }

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    if (
      ReactFeatureFlags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
    ) {
      expect(Scheduler).toHaveYielded([
        'A',
        'D',
        // B should render last since it wasn't clicked.
        'B',
      ]);
    } else {
      // We should prioritize hydrating A, C and D first since we clicked in
      // them. Only after they're done will we hydrate B.
      expect(Scheduler).toHaveYielded([
        'A',
        'Clicked A',
        'C',
        'Clicked C',
        'D',
        'Clicked D',
        // B should render last since it wasn't clicked.
        'B',
      ]);
    }

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

    ReactDOM.hydrateRoot(container, <App />);

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
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Continuing rendering will render B next.
    await act(async () => {
      const target = createEventTarget(spanD);
      target.virtualclick();
    });
    expect(Scheduler).toHaveYielded(['App', 'B', 'C']);

    // After the click, we should prioritize D and the Click first,
    // and only after that render A and C.
    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });
    if (
      gate(
        flags =>
          flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
      )
    ) {
      // no replay
      expect(Scheduler).toHaveYielded(['D', 'A']);
    } else {
      expect(Scheduler).toHaveYielded(['D', 'Clicked D', 'A']);
    }

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
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // This click target cannot be hydrated yet because the first is Suspended.
    createEventTarget(spanA).virtualclick();
    createEventTarget(spanC).virtualclick();
    createEventTarget(spanD).virtualclick();

    if (
      ReactFeatureFlags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
    ) {
      expect(Scheduler).toHaveYielded(['App', 'C', 'Clicked C']);
    } else {
      expect(Scheduler).toHaveYielded(['App']);
    }
    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    if (
      ReactFeatureFlags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
    ) {
      expect(Scheduler).toHaveYielded([
        'A',
        'D',
        // B should render last since it wasn't clicked.
        'B',
      ]);
    } else {
      // We should prioritize hydrating A, C and D first since we clicked in
      // them. Only after they're done will we hydrate B.
      expect(Scheduler).toHaveYielded([
        'A',
        'Clicked A',
        'C',
        'Clicked C',
        'D',
        'Clicked D',
        // B should render last since it wasn't clicked.
        'B',
      ]);
    }

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
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);
    // Click D
    dispatchMouseHoverEvent(spanD, null);
    dispatchClickEvent(spanD);
    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);
    expect(Scheduler).toHaveYielded(['App']);
    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });
    if (
      gate(
        flags =>
          flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
      )
    ) {
      // We should prioritize hydrating D first because we clicked it.
      // but event isnt replayed
      expect(Scheduler).toHaveYielded([
        'D',
        'B', // Ideally this should be later.
        'C',
        'Hover C',
        'A',
      ]);
    } else {
      // We should prioritize hydrating D first because we clicked it.
      // Next we should hydrate C since that's the current hover target.
      // To simplify implementation details we hydrate both B and C at
      // the same time since B was already scheduled.
      // This is ok because it will at least not continue for nested
      // boundary. See the next test below.
      expect(Scheduler).toHaveYielded([
        'D',
        'Clicked D',
        'B', // Ideally this should be later.
        'C',
        'Hover C',
        'A',
      ]);
    }

    document.body.removeChild(container);
  });

  it('replays capture phase for continuous events and respects stopPropagation', async () => {
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
          id={text}
          onClickCapture={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Capture Clicked ' + text);
          }}
          onClick={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Clicked ' + text);
          }}
          onMouseEnter={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Mouse Enter ' + text);
          }}
          onMouseOut={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Mouse Out ' + text);
          }}
          onMouseOutCapture={e => {
            e.preventDefault();
            e.stopPropagation();
            Scheduler.unstable_yieldValue('Mouse Out Capture ' + text);
          }}
          onMouseOverCapture={e => {
            e.preventDefault();
            e.stopPropagation();
            Scheduler.unstable_yieldValue('Mouse Over Capture ' + text);
          }}
          onMouseOver={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Mouse Over ' + text);
          }}>
          <div
            onMouseOverCapture={e => {
              e.preventDefault();
              Scheduler.unstable_yieldValue('Mouse Over Capture Inner ' + text);
            }}>
            {text}
          </div>
        </span>
      );
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <div
          onClickCapture={e => {
            e.preventDefault();
            Scheduler.unstable_yieldValue('Capture Clicked Parent');
          }}
          onMouseOverCapture={e => {
            Scheduler.unstable_yieldValue('Mouse Over Capture Parent');
          }}>
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

    const spanB = document.getElementById('B').firstChild;
    const spanC = document.getElementById('C').firstChild;
    const spanD = document.getElementById('D').firstChild;

    suspend = true;

    // A and D will be suspended. We'll click on D which should take
    // priority, after we unsuspend.
    ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Click D
    dispatchMouseHoverEvent(spanD, null);
    dispatchClickEvent(spanD);
    // Hover over B and then C.
    dispatchMouseHoverEvent(spanB, spanD);
    dispatchMouseHoverEvent(spanC, spanB);

    expect(Scheduler).toHaveYielded(['App']);

    await act(async () => {
      suspend = false;
      resolve();
      await promise;
    });

    if (
      gate(
        flags =>
          flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
      )
    ) {
      // We should prioritize hydrating D first because we clicked it.
      // but event isnt replayed
      expect(Scheduler).toHaveYielded([
        'D',
        'B', // Ideally this should be later.
        'C',
        // Mouse out events aren't replayed
        // 'Mouse Out Capture B',
        // 'Mouse Out B',
        'Mouse Over Capture Parent',
        'Mouse Over Capture C',
        // Stop propagation stops these
        // 'Mouse Over Capture Inner C',
        // 'Mouse Over C',
        'A',
      ]);
    } else {
      // We should prioritize hydrating D first because we clicked it.
      // Next we should hydrate C since that's the current hover target.
      // To simplify implementation details we hydrate both B and C at
      // the same time since B was already scheduled.
      // This is ok because it will at least not continue for nested
      // boundary. See the next test below.
      expect(Scheduler).toHaveYielded([
        'D',
        'Clicked D',
        'B', // Ideally this should be later.
        'C',
        // Capture phase isn't replayed
        // Mouseout isn't replayed
        'Mouse Over C',
        'Mouse Enter C',
        'A',
      ]);
    }

    // This test shows existing quirk where stopPropagation on mouseout
    // prevents mouseEnter from firing
    dispatchMouseHoverEvent(spanC, spanB);
    expect(Scheduler).toHaveYielded([
      'Mouse Out Capture B',
      // stopPropagation stops these
      // 'Mouse Out B',
      // 'Mouse Enter C',
      'Mouse Over Capture Parent',
      'Mouse Over Capture C',
      // Stop propagation stops these
      // 'Mouse Over Capture Inner C',
      // 'Mouse Over C',
    ]);

    document.body.removeChild(container);
  });

  describe('can handle replaying events as part of multiple instances of React', () => {
    let resolveInner;
    let resolveOuter;
    let innerPromise;
    let outerPromise;
    let OuterScheduler;
    let InnerScheduler;
    let innerDiv;

    beforeEach(async () => {
      document.body.innerHTML = '';
      jest.resetModuleRegistry();
      let OuterReactDOM;
      let InnerReactDOM;
      jest.isolateModules(() => {
        OuterReactDOM = require('react-dom');
        OuterScheduler = require('scheduler');
      });
      jest.isolateModules(() => {
        InnerReactDOM = require('react-dom');
        InnerScheduler = require('scheduler');
      });

      expect(OuterReactDOM).not.toBe(InnerReactDOM);
      expect(OuterScheduler).not.toBe(InnerScheduler);

      const outerContainer = document.createElement('div');
      const innerContainer = document.createElement('div');

      let suspendOuter = false;
      outerPromise = new Promise(res => {
        resolveOuter = () => {
          suspendOuter = false;
          res();
        };
      });

      function Outer() {
        if (suspendOuter) {
          OuterScheduler.unstable_yieldValue('Suspend Outer');
          throw outerPromise;
        }
        OuterScheduler.unstable_yieldValue('Outer');
        const innerRoot = outerContainer.querySelector('#inner-root');
        return (
          <div
            id="inner-root"
            onMouseEnter={() => {
              Scheduler.unstable_yieldValue('Outer Mouse Enter');
            }}
            dangerouslySetInnerHTML={{
              __html: innerRoot ? innerRoot.innerHTML : '',
            }}
          />
        );
      }
      const OuterApp = () => {
        return (
          <Suspense fallback={<div>Loading</div>}>
            <Outer />
          </Suspense>
        );
      };

      let suspendInner = false;
      innerPromise = new Promise(res => {
        resolveInner = () => {
          suspendInner = false;
          res();
        };
      });
      function Inner() {
        if (suspendInner) {
          InnerScheduler.unstable_yieldValue('Suspend Inner');
          throw innerPromise;
        }
        InnerScheduler.unstable_yieldValue('Inner');
        return (
          <div
            id="inner"
            onMouseEnter={() => {
              Scheduler.unstable_yieldValue('Inner Mouse Enter');
            }}
          />
        );
      }
      const InnerApp = () => {
        return (
          <Suspense fallback={<div>Loading</div>}>
            <Inner />
          </Suspense>
        );
      };

      document.body.appendChild(outerContainer);
      const outerHTML = ReactDOMServer.renderToString(<OuterApp />);
      outerContainer.innerHTML = outerHTML;

      const innerWrapper = document.querySelector('#inner-root');
      innerWrapper.appendChild(innerContainer);
      const innerHTML = ReactDOMServer.renderToString(<InnerApp />);
      innerContainer.innerHTML = innerHTML;

      expect(OuterScheduler).toHaveYielded(['Outer']);
      expect(InnerScheduler).toHaveYielded(['Inner']);

      suspendOuter = true;
      suspendInner = true;

      OuterReactDOM.hydrateRoot(outerContainer, <OuterApp />);
      InnerReactDOM.hydrateRoot(innerContainer, <InnerApp />);

      expect(OuterScheduler).toFlushAndYield(['Suspend Outer']);
      expect(InnerScheduler).toFlushAndYield(['Suspend Inner']);

      innerDiv = document.querySelector('#inner');

      dispatchClickEvent(innerDiv);

      await act(async () => {
        jest.runAllTimers();
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      expect(OuterScheduler).toHaveYielded(['Suspend Outer']);
      if (
        gate(
          flags =>
            flags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
        )
      ) {
        // InnerApp doesn't see the event because OuterApp calls stopPropagation in
        // capture phase since the event is blocked on suspended component
        expect(InnerScheduler).toHaveYielded([]);
      } else {
        // no stopPropagation
        expect(InnerScheduler).toHaveYielded(['Suspend Inner']);
      }

      expect(Scheduler).toHaveYielded([]);
    });
    afterEach(async () => {
      document.body.innerHTML = '';
    });

    // @gate enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
    it('Inner hydrates first then Outer', async () => {
      dispatchMouseHoverEvent(innerDiv);

      await act(async () => {
        resolveInner();
        await innerPromise;
        jest.runAllTimers();
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      expect(OuterScheduler).toHaveYielded(['Suspend Outer']);
      // Inner App renders because it is unblocked
      expect(InnerScheduler).toHaveYielded(['Inner']);
      // No event is replayed yet
      expect(Scheduler).toHaveYielded([]);

      dispatchMouseHoverEvent(innerDiv);
      expect(OuterScheduler).toHaveYielded([]);
      expect(InnerScheduler).toHaveYielded([]);
      // No event is replayed yet
      expect(Scheduler).toHaveYielded([]);

      await act(async () => {
        resolveOuter();
        await outerPromise;
        jest.runAllTimers();
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // Nothing happens to inner app yet.
      // Its blocked on the outer app replaying the event
      expect(InnerScheduler).toHaveYielded([]);
      // Outer hydrates and schedules Replay
      expect(OuterScheduler).toHaveYielded(['Outer']);
      // No event is replayed yet
      expect(Scheduler).toHaveYielded([]);

      // fire scheduled Replay
      await act(async () => {
        jest.runAllTimers();
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // First Inner Mouse Enter fires then Outer Mouse Enter
      expect(Scheduler).toHaveYielded([
        'Inner Mouse Enter',
        'Outer Mouse Enter',
      ]);
    });

    // @gate enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
    it('Outer hydrates first then Inner', async () => {
      dispatchMouseHoverEvent(innerDiv);

      await act(async () => {
        resolveOuter();
        await outerPromise;
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // Outer resolves and scheduled replay
      expect(OuterScheduler).toHaveYielded(['Outer']);
      // Inner App is still blocked
      expect(InnerScheduler).toHaveYielded([]);

      // Replay outer event
      await act(async () => {
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // Inner is still blocked so when Outer replays the event in capture phase
      // inner ends up caling stopPropagation
      expect(Scheduler).toHaveYielded([]);
      expect(OuterScheduler).toHaveYielded([]);
      expect(InnerScheduler).toHaveYielded(['Suspend Inner']);

      dispatchMouseHoverEvent(innerDiv);
      expect(OuterScheduler).toHaveYielded([]);
      expect(InnerScheduler).toHaveYielded([]);
      expect(Scheduler).toHaveYielded([]);

      await act(async () => {
        resolveInner();
        await innerPromise;
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // Inner hydrates
      expect(InnerScheduler).toHaveYielded(['Inner']);
      // Outer was hydrated earlier
      expect(OuterScheduler).toHaveYielded([]);

      await act(async () => {
        Scheduler.unstable_flushAllWithoutAsserting();
        OuterScheduler.unstable_flushAllWithoutAsserting();
        InnerScheduler.unstable_flushAllWithoutAsserting();
      });

      // First Inner Mouse Enter fires then Outer Mouse Enter
      expect(Scheduler).toHaveYielded([
        'Inner Mouse Enter',
        'Outer Mouse Enter',
      ]);
    });
  });

  // @gate enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
  it('replays event with null target when tree is dismounted', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => {
      resolve = () => {
        suspend = false;
        resolvePromise();
      };
    });

    function Child() {
      if (suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue('Child');
      return (
        <div
          onMouseOver={() => {
            Scheduler.unstable_yieldValue('on mouse over');
          }}>
          Child
        </div>
      );
    }

    function App() {
      return (
        <Suspense>
          <Child />
        </Suspense>
      );
    }

    const finalHTML = ReactDOMServer.renderToString(<App />);
    expect(Scheduler).toHaveYielded(['Child']);

    const container = document.createElement('div');

    document.body.appendChild(container);
    container.innerHTML = finalHTML;
    suspend = true;

    ReactDOM.hydrateRoot(container, <App />);

    const childDiv = container.firstElementChild;
    dispatchMouseHoverEvent(childDiv);

    // Not hydrated so event is saved for replay and stopPropagation is called
    expect(Scheduler).toHaveYielded([]);

    resolve();
    Scheduler.unstable_flushNumberOfYields(1);
    expect(Scheduler).toHaveYielded(['Child']);

    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_ImmediatePriority,
      () => {
        container.removeChild(childDiv);

        const container2 = document.createElement('div');
        container2.addEventListener('mouseover', () => {
          Scheduler.unstable_yieldValue('container2 mouse over');
        });
        container2.appendChild(childDiv);
      },
    );
    Scheduler.unstable_flushAllWithoutAsserting();

    // Even though the tree is remove the event is still dispatched with native event handler
    // on the container firing.
    expect(Scheduler).toHaveYielded(['container2 mouse over']);

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
    ReactDOM.hydrateRoot(container, <App />);

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

    // We should prioritize hydrating D first because we clicked it.
    // Next we should hydrate C since that's the current hover target.
    // Next it doesn't matter if we hydrate A or B first but as an
    // implementation detail we're currently hydrating B first since
    // we at one point hovered over it and we never deprioritized it.
    expect(Scheduler).toHaveYielded(['App', 'C', 'Hover C', 'A', 'B', 'D']);

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

    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B', 'C']);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const spanB = container.getElementsByTagName('span')[1];
    const spanC = container.getElementsByTagName('span')[2];

    const root = ReactDOM.hydrateRoot(container, <App />);

    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    // Increase priority of B and then C.
    root.unstable_scheduleHydration(spanB);
    root.unstable_scheduleHydration(spanC);

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

    act(() => {
      const root = ReactDOM.hydrateRoot(container, <App a="A" />);
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

    const spanA2 = container.getElementsByTagName('span')[0];
    // This is supposed to have been hydrated, not replaced.
    expect(spanA).toBe(spanA2);

    document.body.removeChild(container);
  });

  // @gate enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
  it('fires capture event handlers and native events if content is hydratable during discrete event', async () => {
    spyOnDev(console, 'error');
    function Child({text}) {
      Scheduler.unstable_yieldValue(text);
      const ref = React.useRef();
      React.useLayoutEffect(() => {
        if (!ref.current) {
          return;
        }
        ref.current.onclick = () => {
          Scheduler.unstable_yieldValue('Native Click ' + text);
        };
      }, [text]);
      return (
        <span
          ref={ref}
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

    let finalHTML;
    expect(() => {
      finalHTML = ReactDOMServer.renderToString(<App />);
    }).toErrorDev([
      'useLayoutEffect does nothing on the server',
      'useLayoutEffect does nothing on the server',
    ]);

    expect(Scheduler).toHaveYielded(['App', 'A', 'B']);

    const container = document.createElement('div');
    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[1];

    ReactDOM.hydrateRoot(container, <App />);

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
      'Native Click B',
      'Clicked B',
    ]);

    // After continuing the scheduler, we finally hydrate A.
    expect(Scheduler).toFlushAndYield(['A']);

    document.body.removeChild(container);
  });

  // @gate enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
  it('does not propagate discrete event if it cannot be synchronously hydrated', async () => {
    let triggeredParent = false;
    let triggeredChild = false;
    let suspend = false;
    const promise = new Promise(() => {});
    function Child() {
      if (suspend) {
        throw promise;
      }
      Scheduler.unstable_yieldValue('Child');
      return (
        <span
          onClickCapture={e => {
            e.stopPropagation();
            triggeredChild = true;
          }}>
          Click me
        </span>
      );
    }
    function App() {
      const onClick = () => {
        triggeredParent = true;
      };
      Scheduler.unstable_yieldValue('App');
      return (
        <div
          ref={n => {
            if (n) n.onclick = onClick;
          }}
          onClick={onClick}>
          <Suspense fallback={null}>
            <Child />
          </Suspense>
        </div>
      );
    }
    const finalHTML = ReactDOMServer.renderToString(<App />);

    expect(Scheduler).toHaveYielded(['App', 'Child']);

    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = finalHTML;

    suspend = true;

    ReactDOM.hydrateRoot(container, <App />);
    // Nothing has been hydrated so far.
    expect(Scheduler).toHaveYielded([]);

    const span = container.getElementsByTagName('span')[0];
    dispatchClickEvent(span);

    expect(Scheduler).toHaveYielded(['App']);

    dispatchClickEvent(span);

    expect(triggeredParent).toBe(false);
    expect(triggeredChild).toBe(false);
  });
});
