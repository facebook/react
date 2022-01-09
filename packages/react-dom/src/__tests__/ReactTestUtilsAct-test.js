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
let Scheduler;
let act;
let container;

jest.useRealTimers();

global.IS_REACT_ACT_ENVIRONMENT = true;

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
      if (__DEV__) {
        act(() => concurrentRoot.render(el));
      } else {
        concurrentRoot.render(el);
      }
    };

    const unmountConcurrent = _dom => {
      if (__DEV__) {
        act(() => {
          if (concurrentRoot !== null) {
            concurrentRoot.unmount();
            concurrentRoot = null;
          }
        });
      } else {
        if (concurrentRoot !== null) {
          concurrentRoot.unmount();
          concurrentRoot = null;
        }
      }
    };

    const rerenderConcurrent = el => {
      act(() => concurrentRoot.render(el));
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

    // @gate __DEV__
    it('does not warn in concurrent mode', () => {
      const root = ReactDOM.createRoot(document.createElement('div'));
      act(() => root.render(<App />));
      Scheduler.unstable_flushAll();
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
      // @gate __DEV__
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

      // @gate __DEV__
      it('flushes effects on every call', async () => {
        function App() {
          const [ctr, setCtr] = React.useState(0);
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

        await act(async () => {
          click();
          click();
          click();
        });
        // it consolidates the 3 updates, then fires the effect
        expect(Scheduler).toHaveYielded([3]);
        await act(async () => click());
        expect(Scheduler).toHaveYielded([4]);
        await act(async () => click());
        expect(Scheduler).toHaveYielded([5]);
        expect(button.innerHTML).toBe('5');
      });

      // @gate __DEV__
      it("should keep flushing effects until they're done", () => {
        function App() {
          const [ctr, setCtr] = React.useState(0);
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

      // @gate __DEV__
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

      // @gate __DEV__
      it('warns if a setState is called outside of act(...)', () => {
        let setValue = null;
        function App() {
          const [value, _setValue] = React.useState(0);
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

      // @gate __DEV__
      it('warns if a setState is called outside of act(...) after a component threw', () => {
        let setValue = null;
        function App({defaultValue}) {
          if (defaultValue === undefined) {
            throw new Error('some error');
          }
          const [value, _setValue] = React.useState(defaultValue);
          setValue = _setValue;
          return value;
        }

        expect(() => {
          act(() => {
            render(<App defaultValue={undefined} />, container);
          });
        }).toThrow('some error');

        act(() => {
          rerender(<App defaultValue={0} />, container);
        });

        expect(() => setValue(1)).toErrorDev([
          'An update to App inside a test was not wrapped in act(...).',
        ]);
      });

      // @gate __DEV__
      it('does not warn if IS_REACT_ACT_ENVIRONMENT is set to false', () => {
        let setState;
        function App() {
          const [state, _setState] = React.useState(0);
          setState = _setState;
          return state;
        }

        act(() => {
          render(<App />, container);
        });

        // First show that it does warn
        expect(() => setState(1)).toErrorDev(
          'An update to App inside a test was not wrapped in act(...)',
        );

        // Now do the same thing again, but disable with the environment flag
        const prevIsActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
        global.IS_REACT_ACT_ENVIRONMENT = false;
        try {
          setState(2);
        } finally {
          global.IS_REACT_ACT_ENVIRONMENT = prevIsActEnvironment;
        }

        // When the flag is restored to its previous value, it should start
        // warning again. This shows that React reads the flag each time.
        expect(() => setState(3)).toErrorDev(
          'An update to App inside a test was not wrapped in act(...)',
        );
      });

      describe('fake timers', () => {
        beforeEach(() => {
          jest.useFakeTimers();
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        // @gate __DEV__
        it('lets a ticker update', () => {
          function App() {
            const [toggle, setToggle] = React.useState(0);
            React.useEffect(() => {
              const timeout = setTimeout(() => {
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

        // @gate __DEV__
        it('can use the async version to catch microtasks', async () => {
          function App() {
            const [toggle, setToggle] = React.useState(0);
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

        // @gate __DEV__
        it('can handle cascading promises with fake timers', async () => {
          // this component triggers an effect, that waits a tick,
          // then sets state. repeats this 5 times.
          function App() {
            const [state, setState] = React.useState(0);
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

        // @gate __DEV__
        it('flushes immediate re-renders with act', () => {
          function App() {
            const [ctr, setCtr] = React.useState(0);
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
    });

    describe('asynchronous tests', () => {
      // @gate __DEV__
      it('works with timeouts', async () => {
        function App() {
          const [ctr, setCtr] = React.useState(0);
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
        });
        expect(container.innerHTML).toBe('0');
        // Flush the pending timers
        await act(async () => {
          await sleep(100);
        });
        expect(container.innerHTML).toBe('1');
      });

      // @gate __DEV__
      it('flushes microtasks before exiting (async function)', async () => {
        function App() {
          const [ctr, setCtr] = React.useState(0);
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

      // @gate __DEV__
      it('flushes microtasks before exiting (sync function)', async () => {
        // Same as previous test, but the callback passed to `act` is not itself
        // an async function.
        function App() {
          const [ctr, setCtr] = React.useState(0);
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

        await act(() => {
          render(<App />, container);
        });
        expect(container.innerHTML).toEqual('1');
      });

      // @gate __DEV__
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

      // @gate __DEV__
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
          expect(console.error).toHaveBeenCalledTimes(2);
          expect(console.error.calls.argsFor(0)[0]).toMatch(
            'You seem to have overlapping act() calls',
          );
          expect(console.error.calls.argsFor(1)[0]).toMatch(
            'You seem to have overlapping act() calls',
          );
        }
      });

      // @gate __DEV__
      it('async commits and effects are guaranteed to be flushed', async () => {
        function App() {
          const [state, setState] = React.useState(0);
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

      // @gate __DEV__
      it('can handle cascading promises', async () => {
        // this component triggers an effect, that waits a tick,
        // then sets state. repeats this 5 times.
        function App() {
          const [state, setState] = React.useState(0);
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

    describe('error propagation', () => {
      // @gate __DEV__
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

      // @gate __DEV__
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

      // @gate __DEV__
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

      // @gate __DEV__
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

      // @gate __DEV__
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

        // @gate __DEV__
        it('triggers fallbacks if available', async () => {
          if (label !== 'legacy mode') {
            // FIXME: Support for Concurrent Root intentionally removed
            // from the public version of `act`. It will be added back in
            // a future major version, before the Concurrent Root is released.
            // Consider skipping all non-Legacy tests in this suite until then.
            return;
          }

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
          React.startTransition(() => {
            act(() => {
              rerender(<App suspend={true} />);
            });
          });

          if (label === 'concurrent mode') {
            // In Concurrent Mode, refresh transitions delay indefinitely.
            expect(document.querySelector('[data-test-id=spinner]')).toBeNull();
          } else {
            // In Legacy Mode, all fallbacks are forced to display,
            // even during a refresh transition.
            expect(
              document.querySelector('[data-test-id=spinner]'),
            ).not.toBeNull();
          }

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
    describe('throw in prod mode', () => {
      // @gate !__DEV__
      it('warns if you try to use act() in prod mode', () => {
        expect(() => act(() => {})).toThrow(
          'act(...) is not supported in production builds of React',
        );
      });
    });
  });
}
