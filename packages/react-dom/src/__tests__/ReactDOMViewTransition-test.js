/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let Suspense;
let SuspenseList;
let ViewTransition;
let act;
let assertLog;
let assertConsoleWarnDev;
let Scheduler;
let textCache;
let finishMockViewTransition;
let originalStartViewTransition;
let originalGetBoundingClientRect;
let originalCSS;
let originalGetAnimations;
let originalInnerWidth;
let originalInnerHeight;
let originalFonts;

describe('ReactDOMViewTransition', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    assertConsoleWarnDev = require('internal-test-utils').assertConsoleWarnDev;
    Suspense = React.Suspense;
    ViewTransition = React.ViewTransition;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.unstable_SuspenseList;
    }
    container = document.createElement('div');
    document.body.appendChild(container);

    textCache = new Map();

    finishMockViewTransition = null;
    originalStartViewTransition = document.startViewTransition;
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    originalCSS = global.CSS;
    originalGetAnimations = document.documentElement.getAnimations;
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalFonts = document.fonts;
    if (originalCSS == null || typeof originalCSS.escape !== 'function') {
      global.CSS = {
        escape: value => value,
      };
    }
    document.documentElement.getAnimations = function () {
      return [];
    };
    document.fonts = {
      status: 'loaded',
      ready: Promise.resolve(),
    };
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });
    // Force visibility checks to pass in jsdom so transition callbacks run.
    HTMLElement.prototype.getBoundingClientRect = function () {
      return {
        top: 1,
        left: 1,
        right: 11,
        bottom: 11,
        width: 10,
        height: 10,
        x: 1,
        y: 1,
        toJSON() {},
      };
    };
    document.startViewTransition = jest.fn(({update}) => {
      const ready = Promise.resolve().then(() => update());
      return {
        skipTransition() {},
        ready,
        finished: new Promise(resolve => {
          finishMockViewTransition = resolve;
        }),
      };
    });
  });

  afterEach(() => {
    if (finishMockViewTransition !== null) {
      finishMockViewTransition();
      finishMockViewTransition = null;
    }
    document.startViewTransition = originalStartViewTransition;
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    global.CSS = originalCSS;
    document.documentElement.getAnimations = originalGetAnimations;
    document.fonts = originalFonts;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
    document.body.removeChild(container);
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  // @gate enableSuspenseList
  it('handles ViewTransition wrapping Suspense inside SuspenseList', async () => {
    function Card({id}) {
      return (
        <div>
          <AsyncText text={`Card ${id}`} />
        </div>
      );
    }

    function CardSkeleton({n}) {
      return <Text text={`Skeleton ${n}`} />;
    }

    function App() {
      return (
        <div>
          <SuspenseList revealOrder="together">
            <ViewTransition>
              <Suspense fallback={<CardSkeleton n={1} />}>
                <Card id={1} />
              </Suspense>
            </ViewTransition>
            <ViewTransition>
              <Suspense fallback={<CardSkeleton n={2} />}>
                <Card id={2} />
              </Suspense>
            </ViewTransition>
            <ViewTransition>
              <Suspense fallback={<CardSkeleton n={3} />}>
                <Card id={3} />
              </Suspense>
            </ViewTransition>
          </SuspenseList>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);

    // Initial render - all cards should suspend
    await act(() => {
      root.render(<App />);
    });

    assertLog([
      'Suspend! [Card 1]',
      'Skeleton 1',
      'Suspend! [Card 2]',
      'Skeleton 2',
      'Suspend! [Card 3]',
      'Skeleton 3',
      'Skeleton 1',
      'Skeleton 2',
      'Skeleton 3',
    ]);

    await act(() => {
      resolveText('Card 1');
      resolveText('Card 2');
      resolveText('Card 3');
    });

    assertLog(['Card 1', 'Card 2', 'Card 3']);

    // All cards should be visible
    expect(container.textContent).toContain('Card 1');
    expect(container.textContent).toContain('Card 2');
    expect(container.textContent).toContain('Card 3');
  });

  // @gate enableViewTransition
  it('calls onExit cleanup immediately on unmount', async () => {
    const log = [];

    function App({show}) {
      return show ? (
        <ViewTransition
          exit="exit-class"
          onExit={() => {
            log.push('exit');
            return () => {
              log.push('cleanup');
            };
          }}>
          <div>A</div>
        </ViewTransition>
      ) : null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      React.startTransition(() => {
        root.render(<App show={true} />);
      });
    });
    document.startViewTransition.mockClear();

    log.length = 0;
    await act(async () => {
      React.startTransition(() => {
        root.render(<App show={false} />);
      });
    });
    if (__DEV__) {
      assertConsoleWarnDev([
        'A flushSync update cancelled a View Transition because it was called ' +
          'while the View Transition was still preparing. To preserve the synchronous ' +
          "semantics, React had to skip the View Transition. If you can, try to avoid " +
          "flushSync() in a scenario that's likely to interfere.",
      ]);
    }
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);

    expect(log).toEqual(['exit', 'cleanup']);
  });
});
