/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactDOM;
let ReactTestUtils;
let SchedulerTracing;
let Scheduler;
let act;
let container;

jest.useRealTimers();

function sleep(period) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, period);
  });
}

describe('ReactTestUtils.act()', () => {
  // first we run all the tests with concurrent mode
  if (__EXPERIMENTAL__) {
    let concurrentRoot = null;
    const renderConcurrent = (el, dom) => {
      concurrentRoot = ReactDOM.createRoot(dom);
      concurrentRoot.render(el);
    };

    const unmountConcurrent = _dom => {
      if (concurrentRoot !== null) {
        concurrentRoot.unmount();
        concurrentRoot = null;
      }
    };

    const rerenderConcurrent = el => {
      concurrentRoot.render(el);
    };

    runActTests(
      'concurrent mode',
      renderConcurrent,
      unmountConcurrent,
      rerenderConcurrent,
    );
  }

  // and then in legacy mode

  let legacyDom = null;
  function renderLegacy(el, dom) {
    legacyDom = dom;
    ReactDOM.render(el, dom);
  }

  function unmountLegacy(dom) {
    legacyDom = null;
    ReactDOM.unmountComponentAtNode(dom);
  }

  function rerenderLegacy(el) {
    ReactDOM.render(el, legacyDom);
  }

  runActTests('legacy mode', renderLegacy, unmountLegacy, rerenderLegacy);

  // and then in blocking mode
  if (__EXPERIMENTAL__) {
    let blockingRoot = null;
    const renderBatched = (el, dom) => {
      blockingRoot = ReactDOM.createBlockingRoot(dom);
      blockingRoot.render(el);
    };

    const unmountBatched = dom => {
      if (blockingRoot !== null) {
        blockingRoot.unmount();
        blockingRoot = null;
      }
    };

    const rerenderBatched = el => {
      blockingRoot.render(el);
    };

    runActTests(
      'blocking mode',
      renderBatched,
      unmountBatched,
      rerenderBatched,
    );
  }

  describe('unacted effects', () => {
    function App() {
      React.useEffect(() => {}, []);
      return null;
    }

    it('does not warn in legacy mode', () => {
      expect(() => {
        ReactDOM.render(<App />, document.createElement('div'));
      }).toErrorDev([]);
    });

    it('warns in strict mode', () => {
      expect(() => {
        ReactDOM.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
          document.createElement('div'),
        );
      }).toErrorDev([
        'An update to App ran an effect, but was not wrapped in act(...)',
        'An update to App ran an effect, but was not wrapped in act(...)',
      ]);
    });

    it.experimental('warns in blocking mode', () => {
      expect(() => {
        const root = ReactDOM.createBlockingRoot(document.createElement('div'));
        root.render(<App />);
        Scheduler.unstable_flushAll();
      }).toErrorDev([
        'An update to App ran an effect, but was not wrapped in act(...)',
        'An update to App ran an effect, but was not wrapped in act(...)',
      ]);
    });

    it.experimental('warns in concurrent mode', () => {
      expect(() => {
        const root = ReactDOM.createRoot(document.createElement('div'));
        root.render(<App />);
        Scheduler.unstable_flushAll();
      }).toErrorDev([
        'An update to App ran an effect, but was not wrapped in act(...)',
        'An update to App ran an effect, but was not wrapped in act(...)',
      ]);
    });
  });
});

function runActTests(label, render, unmount, rerender) {
  describe(label, () => {
    beforeEach(() => {
      jest.resetModules();
      React = require('react');
      ReactDOM = require('react-dom');
      ReactTestUtils = require('react-dom/test-utils');
      SchedulerTracing = require('scheduler/tracing');
      Scheduler = require('scheduler');
      act = ReactTestUtils.act;
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      unmount(container);
      document.body.removeChild(container);
    });

    describe('sync', () => {
      it('can use act to flush effects', () => {
        function App() {
          React.useEffect(() => {
            Scheduler.unstable_yieldValue(100);
          });
          return null;
        }

        act(() => {
          render(<App />, container);
        });

        expect(Scheduler).toHaveYielded([100]);
      });

      it('flushes effects on every call', () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          React.useEffect(() => {
            Scheduler.unstable_yieldValue(ctr);
          });
          return (
            <button id="button" onClick={() => setCtr(x => x + 1)}>
              {ctr}
            </button>
          );
        }

        act(() => {
          render(<App />, container);
        });
        expect(Scheduler).toHaveYielded([0]);
        const button = container.querySelector('#button');
        function click() {
          button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        }

        act(() => {
          click();
          click();
          click();
        });
        // it consolidates the 3 updates, then fires the effect
        expect(Scheduler).toHaveYielded([3]);
        act(click);
        expect(Scheduler).toHaveYielded([4]);
        act(click);
        expect(Scheduler).toHaveYielded([5]);
        expect(button.innerHTML).toBe('5');
      });

      it("should keep flushing effects until the're done", () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          React.useEffect(() => {
            if (ctr < 5) {
              setCtr(x => x + 1);
            }
          });
          return ctr;
        }

        act(() => {
          render(<App />, container);
        });

        expect(container.innerHTML).toBe('5');
      });

      it('should flush effects only on exiting the outermost act', () => {
        function App() {
          React.useEffect(() => {
            Scheduler.unstable_yieldValue(0);
          });
          return null;
        }
        // let's nest a couple of act() calls
        act(() => {
          act(() => {
            render(<App />, container);
          });
          // the effect wouldn't have yielded yet because
          // we're still inside an act() scope
          expect(Scheduler).toHaveYielded([]);
        });
        // but after exiting the last one, effects get flushed
        expect(Scheduler).toHaveYielded([0]);
      });

      it('warns if a setState is called outside of act(...)', () => {
        let setValue = null;
        function App() {
          let [value, _setValue] = React.useState(0);
          setValue = _setValue;
          return value;
        }

        act(() => {
          render(<App />, container);
        });

        expect(() => setValue(1)).toErrorDev([
          'An update to App inside a test was not wrapped in act(...).',
        ]);
      });

      describe('fake timers', () => {
        beforeEach(() => {
          jest.useFakeTimers();
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        it('lets a ticker update', () => {
          function App() {
            let [toggle, setToggle] = React.useState(0);
            React.useEffect(() => {
              let timeout = setTimeout(() => {
                setToggle(1);
              }, 200);
              return () => clearTimeout(timeout);
            }, []);
            return toggle;
          }

          act(() => {
            render(<App />, container);
          });
          act(() => {
            jest.runAllTimers();
          });

          expect(container.innerHTML).toBe('1');
        });

        it('can use the async version to catch microtasks', async () => {
          function App() {
            let [toggle, setToggle] = React.useState(0);
            React.useEffect(() => {
              // just like the previous test, except we
              // use a promise and schedule the update
              // after it resolves
              sleep(200).then(() => setToggle(1));
            }, []);
            return toggle;
          }

          act(() => {
            render(<App />, container);
          });
          await act(async () => {
            jest.runAllTimers();
          });

          expect(container.innerHTML).toBe('1');
        });

        it('can handle cascading promises with fake timers', async () => {
          // this component triggers an effect, that waits a tick,
          // then sets state. repeats this 5 times.
          function App() {
            let [state, setState] = React.useState(0);
            async function ticker() {
              await null;
              setState(x => x + 1);
            }
            React.useEffect(() => {
              ticker();
            }, [Math.min(state, 4)]);
            return state;
          }

          await act(async () => {
            render(<App />, container);
          });

          // all 5 ticks present and accounted for
          expect(container.innerHTML).toBe('5');
        });

        it('flushes immediate re-renders with act', () => {
          function App() {
            let [ctr, setCtr] = React.useState(0);
            React.useEffect(() => {
              if (ctr === 0) {
                setCtr(1);
              }
              const timeout = setTimeout(() => setCtr(2), 1000);
              return () => clearTimeout(timeout);
            });
            return ctr;
          }

          act(() => {
            render(<App />, container);
            // Since effects haven't been flushed yet, this does not advance the timer
            jest.runAllTimers();
          });

          expect(container.innerHTML).toBe('1');

          act(() => {
            jest.runAllTimers();
          });

          expect(container.innerHTML).toBe('2');
        });
      });

      it('warns if you return a value inside act', () => {
        expect(() => act(() => null)).toErrorDev(
          [
            'The callback passed to act(...) function must return undefined, or a Promise.',
          ],
          {withoutStack: true},
        );
        expect(() => act(() => 123)).toErrorDev(
          [
            'The callback passed to act(...) function must return undefined, or a Promise.',
          ],
          {withoutStack: true},
        );
      });

      it('warns if you try to await a sync .act call', () => {
        expect(() => act(() => {}).then(() => {})).toErrorDev(
          [
            'Do not await the result of calling act(...) with sync logic, it is not a Promise.',
          ],
          {withoutStack: true},
        );
      });
    });

    describe('asynchronous tests', () => {
      it('works with timeouts', async () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          function doSomething() {
            setTimeout(() => {
              setCtr(1);
            }, 50);
          }

          React.useEffect(() => {
            doSomething();
          }, []);
          return ctr;
        }

        await act(async () => {
          render(<App />, container);
          // flush a little to start the timer
          expect(Scheduler).toFlushAndYield([]);
          await sleep(100);
        });
        expect(container.innerHTML).toBe('1');
      });

      it('flushes microtasks before exiting', async () => {
        function App() {
          let [ctr, setCtr] = React.useState(0);
          async function someAsyncFunction() {
            // queue a bunch of promises to be sure they all flush
            await null;
            await null;
            await null;
            setCtr(1);
          }
          React.useEffect(() => {
            someAsyncFunction();
          }, []);
          return ctr;
        }

        await act(async () => {
          render(<App />, container);
        });
        expect(container.innerHTML).toEqual('1');
      });

      it('warns if you do not await an act call', async () => {
        spyOnDevAndProd(console, 'error');
        act(async () => {});
        // it's annoying that we have to wait a tick before this warning comes in
        await sleep(0);
        if (__DEV__) {
          expect(console.error.calls.count()).toEqual(1);
          expect(console.error.calls.argsFor(0)[0]).toMatch(
            'You called act(async () => ...) without await.',
          );
        }
      });

      it('warns if you try to interleave multiple act calls', async () => {
        spyOnDevAndProd(console, 'error');
        // let's try to cheat and spin off a 'thread' with an act call
        (async () => {
          await act(async () => {
            await sleep(50);
          });
        })();

        await act(async () => {
          await sleep(100);
        });

        await sleep(150);
        if (__DEV__) {
          expect(console.error).toHaveBeenCalledTimes(1);
        }
      });

      it('async commits and effects are guaranteed to be flushed', async () => {
        function App() {
          let [state, setState] = React.useState(0);
          async function something() {
            await null;
            setState(1);
          }
          React.useEffect(() => {
            something();
          }, []);
          React.useEffect(() => {
            Scheduler.unstable_yieldValue(state);
          });
          return state;
        }

        await act(async () => {
          render(<App />, container);
        });
        // exiting act() drains effects and microtasks

        expect(Scheduler).toHaveYielded([0, 1]);
        expect(container.innerHTML).toBe('1');
      });

      it('can handle cascading promises', async () => {
        // this component triggers an effect, that waits a tick,
        // then sets state. repeats this 5 times.
        function App() {
          let [state, setState] = React.useState(0);
          async function ticker() {
            await null;
            setState(x => x + 1);
          }
          React.useEffect(() => {
            Scheduler.unstable_yieldValue(state);
            ticker();
          }, [Math.min(state, 4)]);
          return state;
        }

        await act(async () => {
          render(<App />, container);
        });
        // all 5 ticks present and accounted for
        expect(Scheduler).toHaveYielded([0, 1, 2, 3, 4]);
        expect(container.innerHTML).toBe('5');
      });
    });

    describe('interaction tracing', () => {
      if (__DEV__) {
        it('should correctly trace interactions for sync roots', () => {
          let expectedInteraction;

          const Component = jest.fn(() => {
            expect(expectedInteraction).toBeDefined();

            const interactions = SchedulerTracing.unstable_getCurrent();
            expect(interactions.size).toBe(1);
            expect(interactions).toContain(expectedInteraction);

            return null;
          });

          act(() => {
            SchedulerTracing.unstable_trace(
              'mount traced inside act',
              performance.now(),
              () => {
                const interactions = SchedulerTracing.unstable_getCurrent();
                expect(interactions.size).toBe(1);
                expectedInteraction = Array.from(interactions)[0];

                render(<Component />, container);
              },
            );
          });

          act(() => {
            SchedulerTracing.unstable_trace(
              'update traced inside act',
              performance.now(),
              () => {
                const interactions = SchedulerTracing.unstable_getCurrent();
                expect(interactions.size).toBe(1);
                expectedInteraction = Array.from(interactions)[0];

                rerender(<Component />);
              },
            );
          });

          const secondContainer = document.createElement('div');

          SchedulerTracing.unstable_trace(
            'mount traced outside act',
            performance.now(),
            () => {
              act(() => {
                const interactions = SchedulerTracing.unstable_getCurrent();
                expect(interactions.size).toBe(1);
                expectedInteraction = Array.from(interactions)[0];

                render(<Component />, secondContainer);
              });
            },
          );

          SchedulerTracing.unstable_trace(
            'update traced outside act',
            performance.now(),
            () => {
              act(() => {
                const interactions = SchedulerTracing.unstable_getCurrent();
                expect(interactions.size).toBe(1);
                expectedInteraction = Array.from(interactions)[0];

                rerender(<Component />);
              });
            },
          );

          expect(Component).toHaveBeenCalledTimes(4);
          unmount(secondContainer);
        });
      }
    });

    describe('error propagation', () => {
      it('propagates errors - sync', () => {
        let err;
        try {
          act(() => {
            throw new Error('some error');
          });
        } catch (_err) {
          err = _err;
        } finally {
          expect(err instanceof Error).toBe(true);
          expect(err.message).toBe('some error');
        }
      });

      it('should propagate errors from effects - sync', () => {
        function App() {
          React.useEffect(() => {
            throw new Error('oh no');
          });
          return null;
        }
        let error;

        try {
          act(() => {
            render(<App />, container);
          });
        } catch (_error) {
          error = _error;
        } finally {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('oh no');
        }
      });

      it('propagates errors - async', async () => {
        let err;
        try {
          await act(async () => {
            await sleep(100);
            throw new Error('some error');
          });
        } catch (_err) {
          err = _err;
        } finally {
          expect(err instanceof Error).toBe(true);
          expect(err.message).toBe('some error');
        }
      });

      it('should cleanup after errors - sync', () => {
        function App() {
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('oh yes');
          });
          return null;
        }
        let error;
        try {
          act(() => {
            throw new Error('oh no');
          });
        } catch (_error) {
          error = _error;
        } finally {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('oh no');
          // should be able to render components after this tho
          act(() => {
            render(<App />, container);
          });
          expect(Scheduler).toHaveYielded(['oh yes']);
        }
      });

      it('should cleanup after errors - async', async () => {
        function App() {
          async function somethingAsync() {
            await null;
            Scheduler.unstable_yieldValue('oh yes');
          }
          React.useEffect(() => {
            somethingAsync();
          });
          return null;
        }
        let error;
        try {
          await act(async () => {
            await sleep(100);
            throw new Error('oh no');
          });
        } catch (_error) {
          error = _error;
        } finally {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe('oh no');
          // should be able to render components after this tho
          await act(async () => {
            render(<App />, container);
          });
          expect(Scheduler).toHaveYielded(['oh yes']);
        }
      });
    });

    describe('suspense', () => {
      if (__DEV__ && __EXPERIMENTAL__) {
        // todo - remove __DEV__ check once we start using testing builds
        it('triggers fallbacks if available', async () => {
          let resolved = false;
          let resolve;
          const promise = new Promise(_resolve => {
            resolve = _resolve;
          });

          function Suspends() {
            if (resolved) {
              return 'was suspended';
            }
            throw promise;
          }

          function App(props) {
            return (
              <React.Suspense
                fallback={<span data-test-id="spinner">loading...</span>}>
                {props.suspend ? <Suspends /> : 'content'}
              </React.Suspense>
            );
          }

          // render something so there's content
          act(() => {
            render(<App suspend={false} />, container);
          });

          // trigger a suspendy update
          act(() => {
            rerender(<App suspend={true} />);
          });
          expect(
            document.querySelector('[data-test-id=spinner]'),
          ).not.toBeNull();

          // now render regular content again
          act(() => {
            rerender(<App suspend={false} />);
          });
          expect(document.querySelector('[data-test-id=spinner]')).toBeNull();

          // trigger a suspendy update with a delay
          React.unstable_withSuspenseConfig(
            () => {
              act(() => {
                rerender(<App suspend={true} />);
              });
            },
            {timeout: 5000},
          );
          // the spinner shows up regardless
          expect(
            document.querySelector('[data-test-id=spinner]'),
          ).not.toBeNull();

          // resolve the promise
          await act(async () => {
            resolved = true;
            resolve();
          });

          // spinner gone, content showing
          expect(document.querySelector('[data-test-id=spinner]')).toBeNull();
          expect(container.textContent).toBe('was suspended');
        });
      }
    });
    describe('warn in prod mode', () => {
      it('warns if you try to use act() in prod mode', () => {
        const spy = spyOnDevAndProd(console, 'error');

        act(() => {});

        if (!__DEV__) {
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error.calls.argsFor(0)[0]).toContain(
            'act(...) is not supported in production builds of React',
          );
        } else {
          expect(console.error).toHaveBeenCalledTimes(0);
        }

        spy.calls.reset();
        // does not warn twice
        act(() => {});
        expect(console.error).toHaveBeenCalledTimes(0);
      });
    });
  });
}
