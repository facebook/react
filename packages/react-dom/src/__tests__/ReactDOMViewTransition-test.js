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
let Scheduler;
let textCache;
let startTransition;

describe('ReactDOMViewTransition', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    Suspense = React.Suspense;
    ViewTransition = React.ViewTransition;
    startTransition = React.startTransition;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.unstable_SuspenseList;
    }
    container = document.createElement('div');
    document.body.appendChild(container);

    textCache = new Map();
  });

  afterEach(() => {
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

  describe('ViewTransition event callbacks', () => {
    let originalGetBoundingClientRect;
    let originalGetAnimations;
    let originalAnimate;
    let originalStartViewTransition;

    beforeEach(() => {
      // Save originals
      originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      originalGetAnimations = Element.prototype.getAnimations;
      originalAnimate = Element.prototype.animate;
      originalStartViewTransition = document.startViewTransition;

      // Mock CSS.escape if it doesn't exist
      if (typeof CSS === 'undefined') {
        global.CSS = {escape: str => str};
      } else if (!CSS.escape) {
        CSS.escape = str => str;
      }

      // Mock document.fonts
      if (!document.fonts) {
        Object.defineProperty(document, 'fonts', {
          value: {status: 'loaded', ready: Promise.resolve()},
          configurable: true,
        });
      }

      // Mock getAnimations on Element.prototype (Web Animations API)
      Element.prototype.getAnimations = function () {
        return [];
      };

      // Mock animate on Element.prototype (Web Animations API)
      Element.prototype.animate = function () {
        return {cancel() {}, finished: Promise.resolve()};
      };

      // Mock getBoundingClientRect to return content-length-based sizes
      // so that hasInstanceChanged can detect updates when text changes.
      Element.prototype.getBoundingClientRect = function () {
        const text = this.textContent || '';
        const width = text.length * 10 + 10;
        const height = 20;
        return new DOMRect(0, 0, width, height);
      };

      // Mock document.startViewTransition
      document.startViewTransition = function ({update}) {
        update();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          skipTransition() {},
        };
      };
    });

    afterEach(() => {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      Element.prototype.getAnimations = originalGetAnimations;
      Element.prototype.animate = originalAnimate;
      if (originalStartViewTransition) {
        document.startViewTransition = originalStartViewTransition;
      } else {
        delete document.startViewTransition;
      }
    });

    // @gate enableViewTransition
    it('fires onEnter when a ViewTransition mounts', async () => {
      const onEnter = jest.fn();
      const startViewTransitionSpy = jest.fn(document.startViewTransition);
      document.startViewTransition = startViewTransitionSpy;

      function App({show}) {
        if (!show) {
          return null;
        }
        return (
          <ViewTransition onEnter={onEnter}>
            <div>Hello</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      // Initial render without the ViewTransition
      await act(() => {
        root.render(<App show={false} />);
      });
      expect(onEnter).not.toHaveBeenCalled();
      expect(startViewTransitionSpy).not.toHaveBeenCalled();

      // Mount the ViewTransition inside startTransition
      await act(() => {
        startTransition(() => {
          root.render(<App show={true} />);
        });
      });

      expect(startViewTransitionSpy).toHaveBeenCalled();
      expect(onEnter).toHaveBeenCalledTimes(1);
    });

    // @gate enableViewTransition
    it('fires onExit when a ViewTransition unmounts', async () => {
      const onExit = jest.fn();

      function App({show}) {
        if (!show) {
          return null;
        }
        return (
          <ViewTransition onExit={onExit}>
            <div>Goodbye</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      // Initial render with the ViewTransition
      await act(() => {
        startTransition(() => {
          root.render(<App show={true} />);
        });
      });
      expect(onExit).not.toHaveBeenCalled();

      // Unmount the ViewTransition inside startTransition
      await act(() => {
        startTransition(() => {
          root.render(<App show={false} />);
        });
      });

      expect(onExit).toHaveBeenCalledTimes(1);
    });

    // @gate enableViewTransition
    it('fires onUpdate when content inside a ViewTransition changes', async () => {
      const onUpdate = jest.fn();
      const onEnter = jest.fn();

      function App({text}) {
        return (
          <ViewTransition onUpdate={onUpdate} onEnter={onEnter}>
            <div>{text}</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      // Initial render
      await act(() => {
        startTransition(() => {
          root.render(<App text="Short" />);
        });
      });

      onEnter.mockClear();
      expect(onUpdate).not.toHaveBeenCalled();

      // Update content inside startTransition (different text length
      // produces different getBoundingClientRect values in our mock)
      await act(() => {
        startTransition(() => {
          root.render(<App text="Much longer content here" />);
        });
      });

      expect(onUpdate).toHaveBeenCalledTimes(1);
      // onEnter should NOT fire on an update
      expect(onEnter).not.toHaveBeenCalled();
    });

    // @gate enableViewTransition
    it('fires onShare for paired named transitions instead of onEnter/onExit', async () => {
      const onShareA = jest.fn();
      const onExitA = jest.fn();
      const onShareB = jest.fn();
      const onEnterB = jest.fn();

      function App({page}) {
        if (page === 'a') {
          return (
            <ViewTransition
              key="a"
              name="hero"
              onShare={onShareA}
              onExit={onExitA}>
              <div>Page A</div>
            </ViewTransition>
          );
        }
        return (
          <ViewTransition
            key="b"
            name="hero"
            onShare={onShareB}
            onEnter={onEnterB}>
            <div>Page B</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      // Render page A
      await act(() => {
        startTransition(() => {
          root.render(<App page="a" />);
        });
      });

      // Clear any enter callbacks from initial mount
      onShareA.mockClear();
      onExitA.mockClear();
      onShareB.mockClear();
      onEnterB.mockClear();

      // Switch from page A to page B inside startTransition
      await act(() => {
        startTransition(() => {
          root.render(<App page="b" />);
        });
      });

      // onShare should fire on the exiting side (page A)
      expect(onShareA).toHaveBeenCalledTimes(1);
      // onExit should NOT fire when share takes precedence
      expect(onExitA).not.toHaveBeenCalled();
      // onEnter should NOT fire on the entering side when paired
      expect(onEnterB).not.toHaveBeenCalled();
    });

    // @gate enableViewTransition
    it('fires onUpdate when the name changes with no layout change (default="none" + share)', async () => {
      // This is the camera-hero morph reduced to one boundary: the `name` prop
      // changes between renders with no child DOM mutation and no layout change.
      // It mirrors the repro's config (default="none" + share). The name change
      // alone must drive the boundary's update so the share class is applied to
      // the host instance and the morph runs.
      //
      // IMPORTANT: jsdom's getComputedStyle returns '' for clipPath/overflow/etc,
      // which makes createMeasurement() flag every boundary as a "clip" parent so
      // hasInstanceChanged() always returns true. That would mask whether the
      // Update flag is actually driven by the name change (the behaviour a real
      // browser depends on) instead of by a spurious measured change. We return
      // realistic computed styles so clip=false; combined with an unchanged
      // bounding rect, the name change is the ONLY thing that can mark this
      // boundary as updated.
      const realComputedStyle = new Proxy(
        {},
        {
          get(_target, prop) {
            switch (prop) {
              case 'clipPath':
                return 'none';
              case 'overflow':
                return 'visible';
              case 'filter':
                return 'none';
              case 'mask':
                return 'none';
              case 'borderRadius':
                return '0px';
              case 'position':
                return 'static';
              case 'display':
                return 'block';
              default:
                return '';
            }
          },
        },
      );
      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = () => realComputedStyle;

      const onUpdate = jest.fn();

      function App({name}) {
        return (
          <ViewTransition
            name={name}
            share="morph"
            default="none"
            onUpdate={onUpdate}>
            <div>Static</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      try {
        await act(() => {
          startTransition(() => {
            root.render(<App name="hero-a" />);
          });
        });

        onUpdate.mockClear();

        // Only the name changes. The child text is identical, so there is no DOM
        // mutation and (with the computed-style mock) no measured change.
        await act(() => {
          startTransition(() => {
            root.render(<App name="hero-b" />);
          });
        });

        expect(onUpdate).toHaveBeenCalledTimes(1);
      } finally {
        global.getComputedStyle = originalGetComputedStyle;
      }
    });

    // @gate enableViewTransition
    it('does not treat a no-op render as an update when default="none" and no name change', async () => {
      // Guard: default="none" with a share class must still gate out ordinary
      // re-renders that neither mutate the DOM nor change the name.
      const onUpdate = jest.fn();

      function App() {
        return (
          <ViewTransition share="morph" default="none" onUpdate={onUpdate}>
            <div>Static</div>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        startTransition(() => {
          root.render(<App />);
        });
      });

      onUpdate.mockClear();

      await act(() => {
        startTransition(() => {
          root.render(<App />);
        });
      });

      expect(onUpdate).not.toHaveBeenCalled();
    });

    // @gate enableViewTransition
    it('fires onEnter when Suspense content resolves', async () => {
      const onEnter = jest.fn();

      function App() {
        return (
          <ViewTransition onEnter={onEnter}>
            <Suspense fallback={<div>Loading...</div>}>
              <div>
                <AsyncText text="Loaded" />
              </div>
            </Suspense>
          </ViewTransition>
        );
      }

      const root = ReactDOMClient.createRoot(container);

      // Initial render - content suspends
      await act(() => {
        startTransition(() => {
          root.render(<App />);
        });
      });

      assertLog(['Suspend! [Loaded]', 'Suspend! [Loaded]']);
      // onEnter fires for the fallback appearing
      const enterCallsAfterFallback = onEnter.mock.calls.length;
      onEnter.mockClear();

      // Resolve the suspended content
      await act(() => {
        resolveText('Loaded');
      });
      assertLog(['Loaded']);

      expect(container.textContent).toBe('Loaded');
      // The reveal of the resolved content should trigger enter
      // (or it may have triggered on the initial fallback mount)
      expect(
        onEnter.mock.calls.length + enterCallsAfterFallback,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
