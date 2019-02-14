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
let act;

jest.useRealTimers();

function sleep(period) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, period);
  });
}

describe('act', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    act = ReactTestUtils.act;
  });

  describe('sync', () => {
    it('can use act to batch effects', () => {
      function App(props) {
        React.useEffect(props.callback);
        return null;
      }
      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        let called = false;
        act(() => {
          ReactDOM.render(
            <App
              callback={() => {
                called = true;
              }}
            />,
            container,
          );
        });

        expect(called).toBe(true);
      } finally {
        document.body.removeChild(container);
      }
    });

    it('flushes effects on every call', () => {
      function App(props) {
        let [ctr, setCtr] = React.useState(0);
        React.useEffect(() => {
          props.callback(ctr);
        });
        return (
          <button id="button" onClick={() => setCtr(x => x + 1)}>
            click me!
          </button>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      let calledCtr = 0;
      act(() => {
        ReactDOM.render(
          <App
            callback={val => {
              calledCtr = val;
            }}
          />,
          container,
        );
      });
      const button = document.getElementById('button');
      function click() {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      }

      act(() => {
        click();
        click();
        click();
      });
      expect(calledCtr).toBe(3);
      act(click);
      expect(calledCtr).toBe(4);
      act(click);
      expect(calledCtr).toBe(5);

      document.body.removeChild(container);
    });

    it('can use act to batch effects on updates too', () => {
      function App() {
        let [ctr, setCtr] = React.useState(0);
        return (
          <button id="button" onClick={() => setCtr(x => x + 1)}>
            {ctr}
          </button>
        );
      }
      const container = document.createElement('div');
      document.body.appendChild(container);
      let button;
      act(() => {
        ReactDOM.render(<App />, container);
      });
      button = document.getElementById('button');
      expect(button.innerHTML).toBe('0');
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(button.innerHTML).toBe('1');
      document.body.removeChild(container);
    });

    it('detects setState being called outside of act(...)', () => {
      let setValueRef = null;
      function App() {
        let [value, setValue] = React.useState(0);
        setValueRef = setValue;
        return (
          <button id="button" onClick={() => setValue(2)}>
            {value}
          </button>
        );
      }
      const container = document.createElement('div');
      document.body.appendChild(container);
      let button;
      act(() => {
        ReactDOM.render(<App />, container);
        button = container.querySelector('#button');
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(button.innerHTML).toBe('2');
      expect(() => setValueRef(1)).toWarnDev([
        'An update to App inside a test was not wrapped in act(...).',
      ]);
      document.body.removeChild(container);
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
        const container = document.createElement('div');

        act(() => {
          act(() => {
            ReactDOM.render(<App />, container);
          });
          jest.runAllTimers();
        });

        expect(container.innerHTML).toBe('1');
      });
    });

    it('warns if you return a value inside act', () => {
      expect(() => act(() => null)).toWarnDev(
        [
          'The callback passed to ReactTestUtils.act(...) function must return undefined, or a Promise.',
        ],
        {withoutStack: true},
      );
      expect(() => act(() => 123)).toWarnDev(
        [
          'The callback passed to ReactTestUtils.act(...) function must return undefined, or a Promise.',
        ],
        {withoutStack: true},
      );
    });

    it('warns if you try to await an .act call', () => {
      expect(act(() => {}).then).toWarnDev(
        [
          'Do not await the result of calling ReactTestUtils.act(...) with sync logic, it is not a Promise.',
        ],
        {withoutStack: true},
      );
    });
  });
  describe('async', () => {
    it('does the async stuff', async () => {
      function App() {
        let [ctr, setCtr] = React.useState(0);
        function doSomething() {
          setTimeout(() => {
            setCtr(1);
          }, 200);
        }

        React.useEffect(() => {
          doSomething();
        }, []);
        return ctr;
      }
      const el = document.createElement('div');
      await act(async () => {
        act(() => {
          ReactDOM.render(<App />, el);
        });

        await sleep(500);
        expect(el.innerHTML).toBe('1');
      });
    });

    it('warns if you do not await an act call', async () => {
      spyOnDevAndProd(console, 'error');
      act(async () => {});
      // it's annoying that we have to wait a tick before this warning comes in
      await sleep(0);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('it warns if you try to interleave multiple act calls', async () => {
      spyOnDevAndProd(console, 'error');
      (async () => {
        await act(async () => {
          await sleep(200);
        });
      })();

      await act(async () => {
        await sleep(500);
      });

      await sleep(1000);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('commits are effects are guaranteed to be flushed', async () => {
      function App(props) {
        let [state, setState] = React.useState(0);
        async function something() {
          await null;
          setState(1);
        }
        React.useEffect(() => {
          something();
        }, []);
        React.useEffect(() => {
          props.callback();
        });
        return state;
      }
      let ctr = 0;
      const div = document.createElement('div');

      await act(async () => {
        act(() => {
          ReactDOM.render(<App callback={() => ctr++} />, div);
        });
        expect(div.innerHTML).toBe('0');
        expect(ctr).toBe(1);
      });

      expect(div.innerHTML).toBe('1');
      expect(ctr).toBe(2);
    });
  });
});

// todo - errors are caught as expected
