/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

let React;
let ReactDOM;
let ReactFreshRuntime;
let act;

const babel = require('@babel/core');
const freshPlugin = require('react-refresh/babel');

describe('ReactFreshIntegration', () => {
  let container;
  let exportsObj;

  beforeEach(() => {
    if (__DEV__) {
      jest.resetModules();
      React = require('react');
      ReactFreshRuntime = require('react-refresh/runtime');
      ReactFreshRuntime.injectIntoGlobalHook(global);
      ReactDOM = require('react-dom');
      act = require('react-dom/test-utils').unstable_concurrentAct;
      container = document.createElement('div');
      document.body.appendChild(container);
      exportsObj = undefined;
    }
  });

  afterEach(() => {
    if (__DEV__) {
      ReactDOM.unmountComponentAtNode(container);
      // Ensure we don't leak memory by holding onto dead roots.
      expect(ReactFreshRuntime._getMountedRootCount()).toBe(0);
      document.body.removeChild(container);
    }
  });

  describe('with compiled destructuring', () => {
    runTests(true);
  });

  describe('without compiled destructuring', () => {
    runTests(false);
  });

  function runTests(compileDestructuring) {
    function execute(source) {
      const compiled = babel.transform(source, {
        babelrc: false,
        presets: ['@babel/react'],
        plugins: [
          [freshPlugin, {skipEnvCheck: true}],
          '@babel/plugin-transform-modules-commonjs',
          compileDestructuring && '@babel/plugin-transform-destructuring',
        ].filter(Boolean),
      }).code;
      exportsObj = {};
      // eslint-disable-next-line no-new-func
      new Function(
        'global',
        'React',
        'exports',
        '$RefreshReg$',
        '$RefreshSig$',
        compiled,
      )(global, React, exportsObj, $RefreshReg$, $RefreshSig$);
      // Module systems will register exports as a fallback.
      // This is useful for cases when e.g. a class is exported,
      // and we don't want to propagate the update beyond this module.
      $RefreshReg$(exportsObj.default, 'exports.default');
      return exportsObj.default;
    }

    function render(source) {
      const Component = execute(source);
      act(() => {
        ReactDOM.render(<Component />, container);
      });
      // Module initialization shouldn't be counted as a hot update.
      expect(ReactFreshRuntime.performReactRefresh()).toBe(null);
    }

    function patch(source) {
      const prevExports = exportsObj;
      execute(source);
      const nextExports = exportsObj;

      // Check if exported families have changed.
      // (In a real module system we'd do this for *all* exports.)
      // For example, this can happen if you convert a class to a function.
      // Or if you wrap something in a HOC.
      const didExportsChange =
        ReactFreshRuntime.getFamilyByType(prevExports.default) !==
        ReactFreshRuntime.getFamilyByType(nextExports.default);
      if (didExportsChange) {
        // In a real module system, we would propagate such updates upwards,
        // and re-execute modules that imported this one. (Just like if we edited them.)
        // This makes adding/removing/renaming exports re-render references to them.
        // Here, we'll just force a re-render using the newer type to emulate this.
        const NextComponent = nextExports.default;
        act(() => {
          ReactDOM.render(<NextComponent />, container);
        });
      }
      act(() => {
        const result = ReactFreshRuntime.performReactRefresh();
        if (!didExportsChange) {
          // Normally we expect that some components got updated in our tests.
          expect(result).not.toBe(null);
        } else {
          // However, we have tests where we convert functions to classes,
          // and in those cases it's expected nothing would get updated.
          // (Instead, the export change branch above would take care of it.)
        }
      });
      expect(ReactFreshRuntime._getMountedRootCount()).toBe(1);
    }

    function $RefreshReg$(type, id) {
      ReactFreshRuntime.register(type, id);
    }

    function $RefreshSig$() {
      return ReactFreshRuntime.createSignatureFunctionForTransform();
    }

    it('reloads function declarations', () => {
      if (__DEV__) {
        render(`
          function Parent() {
            return <Child prop="A" />;
          };

          function Child({prop}) {
            return <h1>{prop}1</h1>;
          };

          export default Parent;
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          function Parent() {
            return <Child prop="B" />;
          };

          function Child({prop}) {
            return <h1>{prop}2</h1>;
          };

          export default Parent;
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');
      }
    });

    it('reloads arrow functions', () => {
      if (__DEV__) {
        render(`
          const Parent = () => {
            return <Child prop="A" />;
          };

          const Child = ({prop}) => {
            return <h1>{prop}1</h1>;
          };

          export default Parent;
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          const Parent = () => {
            return <Child prop="B" />;
          };

          const Child = ({prop}) => {
            return <h1>{prop}2</h1>;
          };

          export default Parent;
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');
      }
    });

    it('reloads a combination of memo and forwardRef', () => {
      if (__DEV__) {
        render(`
          const {memo} = React;

          const Parent = memo(React.forwardRef(function (props, ref) {
            return <Child prop="A" ref={ref} />;
          }));

          const Child = React.memo(({prop}) => {
            return <h1>{prop}1</h1>;
          });

          export default React.memo(Parent);
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          const {memo} = React;

          const Parent = memo(React.forwardRef(function (props, ref) {
            return <Child prop="B" ref={ref} />;
          }));

          const Child = React.memo(({prop}) => {
            return <h1>{prop}2</h1>;
          });

          export default React.memo(Parent);
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');
      }
    });

    it('reloads default export with named memo', () => {
      if (__DEV__) {
        render(`
          const {memo} = React;

          const Child = React.memo(({prop}) => {
            return <h1>{prop}1</h1>;
          });

          export default memo(React.forwardRef(function Parent(props, ref) {
            return <Child prop="A" ref={ref} />;
          }));
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          const {memo} = React;

          const Child = React.memo(({prop}) => {
            return <h1>{prop}2</h1>;
          });

          export default memo(React.forwardRef(function Parent(props, ref) {
            return <Child prop="B" ref={ref} />;
          }));
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');
      }
    });

    it('reloads HOCs if they return functions', () => {
      if (__DEV__) {
        render(`
          function hoc(letter) {
            return function() {
              return <h1>{letter}1</h1>;
            }
          }

          export default function Parent() {
            return <Child />;
          }

          const Child = hoc('A');
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          function hoc(letter) {
            return function() {
              return <h1>{letter}2</h1>;
            }
          }

          export default function Parent() {
            return React.createElement(Child);
          }

          const Child = hoc('B');
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');
      }
    });

    it('resets state when renaming a state variable', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;
          const S = 1;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>A{foo}</h1>;
          }
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;
          const S = 2;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>B{foo}</h1>;
          }
        `);
        // Same state variable name, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;
          const S = 3;

          export default function App() {
            const [bar, setBar] = useState(S);
            return <h1>C{bar}</h1>;
          }
        `);
        // Different state variable name, so state is reset.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('C3');
      }
    });

    it('resets state when renaming a state variable in a HOC', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;
          const S = 1;

          function hoc(Wrapped) {
            return function Generated() {
              const [foo, setFoo] = useState(S);
              return <Wrapped value={foo} />;
            };
          }

          export default hoc(({ value }) => {
            return <h1>A{value}</h1>;
          });
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;
          const S = 2;

          function hoc(Wrapped) {
            return function Generated() {
              const [foo, setFoo] = useState(S);
              return <Wrapped value={foo} />;
            };
          }

          export default hoc(({ value }) => {
            return <h1>B{value}</h1>;
          });
        `);
        // Same state variable name, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;
          const S = 3;

          function hoc(Wrapped) {
            return function Generated() {
              const [bar, setBar] = useState(S);
              return <Wrapped value={bar} />;
            };
          }

          export default hoc(({ value }) => {
            return <h1>C{value}</h1>;
          });
        `);
        // Different state variable name, so state is reset.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('C3');
      }
    });

    it('resets state when renaming a state variable in a HOC with indirection', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;
          const S = 1;

          function hoc(Wrapped) {
            return function Generated() {
              const [foo, setFoo] = useState(S);
              return <Wrapped value={foo} />;
            };
          }

          function Indirection({ value }) {
            return <h1>A{value}</h1>;
          }

          export default hoc(Indirection);
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;
          const S = 2;

          function hoc(Wrapped) {
            return function Generated() {
              const [foo, setFoo] = useState(S);
              return <Wrapped value={foo} />;
            };
          }

          function Indirection({ value }) {
            return <h1>B{value}</h1>;
          }

          export default hoc(Indirection);
        `);
        // Same state variable name, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;
          const S = 3;

          function hoc(Wrapped) {
            return function Generated() {
              const [bar, setBar] = useState(S);
              return <Wrapped value={bar} />;
            };
          }

          function Indirection({ value }) {
            return <h1>C{value}</h1>;
          }

          export default hoc(Indirection);
        `);
        // Different state variable name, so state is reset.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('C3');
      }
    });

    it('resets state when renaming a state variable inside a HOC with direct call', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;
          const S = 1;

          function hocWithDirectCall(Wrapped) {
            return function Generated() {
              return Wrapped();
            };
          }

          export default hocWithDirectCall(() => {
            const [foo, setFoo] = useState(S);
            return <h1>A{foo}</h1>;
          });
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;
          const S = 2;

          function hocWithDirectCall(Wrapped) {
            return function Generated() {
              return Wrapped();
            };
          }

          export default hocWithDirectCall(() => {
            const [foo, setFoo] = useState(S);
            return <h1>B{foo}</h1>;
          });
        `);
        // Same state variable name, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;
          const S = 3;

          function hocWithDirectCall(Wrapped) {
            return function Generated() {
              return Wrapped();
            };
          }

          export default hocWithDirectCall(() => {
            const [bar, setBar] = useState(S);
            return <h1>C{bar}</h1>;
          });
        `);
        // Different state variable name, so state is reset.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('C3');
      }
    });

    it('does not crash when changing Hook order inside a HOC with direct call', () => {
      if (__DEV__) {
        render(`
          const {useEffect} = React;

          function hocWithDirectCall(Wrapped) {
            return function Generated() {
              return Wrapped();
            };
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            return <h1>A</h1>;
          });
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A');

        patch(`
          const {useEffect} = React;

          function hocWithDirectCall(Wrapped) {
            return function Generated() {
              return Wrapped();
            };
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            useEffect(() => {}, []);
            return <h1>B</h1>;
          });
        `);
        // Hook order changed, so we remount.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('B');
      }
    });

    it('does not crash when changing Hook order inside a memo-ed HOC with direct call', () => {
      if (__DEV__) {
        render(`
          const {useEffect, memo} = React;

          function hocWithDirectCall(Wrapped) {
            return memo(function Generated() {
              return Wrapped();
            });
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            return <h1>A</h1>;
          });
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A');

        patch(`
          const {useEffect, memo} = React;

          function hocWithDirectCall(Wrapped) {
            return memo(function Generated() {
              return Wrapped();
            });
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            useEffect(() => {}, []);
            return <h1>B</h1>;
          });
        `);
        // Hook order changed, so we remount.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('B');
      }
    });

    it('does not crash when changing Hook order inside a memo+forwardRef-ed HOC with direct call', () => {
      if (__DEV__) {
        render(`
          const {useEffect, memo, forwardRef} = React;

          function hocWithDirectCall(Wrapped) {
            return memo(forwardRef(function Generated() {
              return Wrapped();
            }));
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            return <h1>A</h1>;
          });
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A');

        patch(`
          const {useEffect, memo, forwardRef} = React;

          function hocWithDirectCall(Wrapped) {
            return memo(forwardRef(function Generated() {
              return Wrapped();
            }));
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            useEffect(() => {}, []);
            return <h1>B</h1>;
          });
        `);
        // Hook order changed, so we remount.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('B');
      }
    });

    it('does not crash when changing Hook order inside a HOC returning an object', () => {
      if (__DEV__) {
        render(`
          const {useEffect} = React;

          function hocWithDirectCall(Wrapped) {
            return {Wrapped: Wrapped};
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            return <h1>A</h1>;
          }).Wrapped;
        `);
        const el = container.firstChild;
        expect(el.textContent).toBe('A');

        patch(`
          const {useEffect} = React;

          function hocWithDirectCall(Wrapped) {
            return {Wrapped: Wrapped};
          }

          export default hocWithDirectCall(() => {
            useEffect(() => {}, []);
            useEffect(() => {}, []);
            return <h1>B</h1>;
          }).Wrapped;
        `);
        // Hook order changed, so we remount.
        expect(container.firstChild).not.toBe(el);
        const newEl = container.firstChild;
        expect(newEl.textContent).toBe('B');
      }
    });

    it('resets effects while preserving state', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;

          export default function App() {
            const [value, setValue] = useState(0);
            return <h1>A{value}</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A0');

        // Add an effect.
        patch(`
          const {useState} = React;

          export default function App() {
            const [value, setValue] = useState(0);
            React.useEffect(() => {
              const id = setInterval(() => {
                setValue(v => v + 1);
              }, 1000);
              return () => clearInterval(id);
            }, []);
            return <h1>B{value}</h1>;
          }
        `);
        // We added an effect, thereby changing Hook order.
        // This causes a remount.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B0');

        act(() => {
          jest.advanceTimersByTime(1000);
        });
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;

          export default function App() {
            const [value, setValue] = useState(0);
            React.useEffect(() => {
              const id = setInterval(() => {
                setValue(v => v + 10);
              }, 1000);
              return () => clearInterval(id);
            }, []);
            return <h1>C{value}</h1>;
          }
        `);
        // Same Hooks are called, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('C1');

        // Effects are always reset, so timer was reinstalled.
        // The new version increments by 10 rather than 1.
        act(() => {
          jest.advanceTimersByTime(1000);
        });
        expect(el.textContent).toBe('C11');

        patch(`
          const {useState} = React;

          export default function App() {
            const [value, setValue] = useState(0);
            return <h1>D{value}</h1>;
          }
        `);
        // Removing the effect changes the signature
        // and causes the component to remount.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('D0');
      }
    });

    it('does not get confused when custom hooks are reordered', () => {
      if (__DEV__) {
        render(`
          function useFancyState(initialState) {
            return React.useState(initialState);
          }

          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>A{x}{y}</h1>;
          };

          export default App;
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('AXY');

        patch(`
          function useFancyState(initialState) {
            return React.useState(initialState);
          }

          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>B{x}{y}</h1>;
          };

          export default App;
        `);
        // Same state variables, so no remount.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('BXY');

        patch(`
          function useFancyState(initialState) {
            return React.useState(initialState);
          }

          const App = () => {
            const [y, setY] = useFancyState('Y');
            const [x, setX] = useFancyState('X');
            return <h1>B{x}{y}</h1>;
          };

          export default App;
        `);
        // Hooks were re-ordered. This causes a remount.
        // Therefore, Hook calls don't accidentally share state.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('BXY');
      }
    });

    it('does not get confused when component is called early', () => {
      if (__DEV__) {
        render(`
          // This isn't really a valid pattern but it's close enough
          // to simulate what happens when you call ReactDOM.render
          // in the same file. We want to ensure this doesn't confuse
          // the runtime.
          App();

          function App() {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>A{x}{y}</h1>;
          };

          function useFancyState(initialState) {
            // No real Hook calls to avoid triggering invalid call invariant.
            // We only want to verify that we can still call this function early.
            return initialState;
          }

          export default App;
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('AXY');

        patch(`
          // This isn't really a valid pattern but it's close enough
          // to simulate what happens when you call ReactDOM.render
          // in the same file. We want to ensure this doesn't confuse
          // the runtime.
          App();

          function App() {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>B{x}{y}</h1>;
          };

          function useFancyState(initialState) {
            // No real Hook calls to avoid triggering invalid call invariant.
            // We only want to verify that we can still call this function early.
            return initialState;
          }

          export default App;
        `);
        // Same state variables, so no remount.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('BXY');

        patch(`
          // This isn't really a valid pattern but it's close enough
          // to simulate what happens when you call ReactDOM.render
          // in the same file. We want to ensure this doesn't confuse
          // the runtime.
          App();

          function App() {
            const [y, setY] = useFancyState('Y');
            const [x, setX] = useFancyState('X');
            return <h1>B{x}{y}</h1>;
          };

          function useFancyState(initialState) {
            // No real Hook calls to avoid triggering invalid call invariant.
            // We only want to verify that we can still call this function early.
            return initialState;
          }

          export default App;
        `);
        // Hooks were re-ordered. This causes a remount.
        // Therefore, Hook calls don't accidentally share state.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('BXY');
      }
    });

    it('does not get confused by Hooks defined inline', () => {
      // This is not a recommended pattern but at least it shouldn't break.
      if (__DEV__) {
        render(`
          const App = () => {
            const useFancyState = (initialState) => {
              const result = React.useState(initialState);
              return result;
            };
            const [x, setX] = useFancyState('X1');
            const [y, setY] = useFancyState('Y1');
            return <h1>A{x}{y}</h1>;
          };

          export default App;
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('AX1Y1');

        patch(`
          const App = () => {
            const useFancyState = (initialState) => {
              const result = React.useState(initialState);
              return result;
            };
            const [x, setX] = useFancyState('X2');
            const [y, setY] = useFancyState('Y2');
            return <h1>B{x}{y}</h1>;
          };

          export default App;
        `);
        // Remount even though nothing changed because
        // the custom Hook is inside -- and so we don't
        // really know whether its signature has changed.
        // We could potentially make it work, but for now
        // let's assert we don't crash with confusing errors.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('BX2Y2');
      }
    });

    it('remounts component if custom hook it uses changes order', () => {
      if (__DEV__) {
        render(`
          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>A{x}{y}</h1>;
          };

          const useFancyState = (initialState) => {
            const result = useIndirection(initialState);
            return result;
          };

          function useIndirection(initialState) {
            return React.useState(initialState);
          }

          export default App;
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('AXY');

        patch(`
          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>B{x}{y}</h1>;
          };

          const useFancyState = (initialState) => {
            const result = useIndirection();
            return result;
          };

          function useIndirection(initialState) {
            return React.useState(initialState);
          }

          export default App;
        `);
        // We didn't change anything except the header text.
        // So we don't expect a remount.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('BXY');

        patch(`
          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>C{x}{y}</h1>;
          };

          const useFancyState = (initialState) => {
            const result = useIndirection(initialState);
            return result;
          };

          function useIndirection(initialState) {
            React.useEffect(() => {});
            return React.useState(initialState);
          }

          export default App;
        `);
        // The useIndirection Hook added an affect,
        // so we had to remount the component.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('CXY');

        patch(`
          const App = () => {
            const [x, setX] = useFancyState('X');
            const [y, setY] = useFancyState('Y');
            return <h1>D{x}{y}</h1>;
          };

          const useFancyState = (initialState) => {
            const result = useIndirection();
            return result;
          };

          function useIndirection(initialState) {
            React.useEffect(() => {});
            return React.useState(initialState);
          }

          export default App;
        `);
        // We didn't change anything except the header text.
        // So we don't expect a remount.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('DXY');
      }
    });

    it('does not lose the inferred arrow names', () => {
      if (__DEV__) {
        render(`
          const Parent = () => {
            return <Child/>;
          };

          const Child = () => {
            useMyThing();
            return <h1>{Parent.name} {Child.name} {useMyThing.name}</h1>;
          };

          const useMyThing = () => {
            React.useState();
          };

          export default Parent;
        `);
        expect(container.textContent).toBe('Parent Child useMyThing');
      }
    });

    it('does not lose the inferred function names', () => {
      if (__DEV__) {
        render(`
          var Parent = function() {
            return <Child/>;
          };

          var Child = function() {
            useMyThing();
            return <h1>{Parent.name} {Child.name} {useMyThing.name}</h1>;
          };

          var useMyThing = function() {
            React.useState();
          };

          export default Parent;
        `);
        expect(container.textContent).toBe('Parent Child useMyThing');
      }
    });

    it('resets state on every edit with @refresh reset annotation', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;
          const S = 1;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>A{foo}</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;
          const S = 2;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>B{foo}</h1>;
          }
        `);
        // Same state variable name, so state is preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;
          const S = 3;

          /* @refresh reset */

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>C{foo}</h1>;
          }
        `);
        // Found remount annotation, so state is reset.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C3');

        patch(`
          const {useState} = React;
          const S = 4;

          export default function App() {

            // @refresh reset

            const [foo, setFoo] = useState(S);
            return <h1>D{foo}</h1>;
          }
        `);
        // Found remount annotation, so state is reset.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('D4');

        patch(`
          const {useState} = React;
          const S = 5;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>E{foo}</h1>;
          }
        `);
        // There is no remount annotation anymore,
        // so preserve the previous state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('E4');

        patch(`
          const {useState} = React;
          const S = 6;

          export default function App() {
            const [foo, setFoo] = useState(S);
            return <h1>F{foo}</h1>;
          }
        `);
        // Continue editing.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('F4');

        patch(`
          const {useState} = React;
          const S = 7;

          export default function App() {

            /* @refresh reset */

            const [foo, setFoo] = useState(S);
            return <h1>G{foo}</h1>;
          }
        `);
        // Force remount one last time.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('G7');
      }
    });

    // This is best effort for simple cases.
    // We won't attempt to resolve identifiers.
    it('resets state when useState initial state is edited', () => {
      if (__DEV__) {
        render(`
          const {useState} = React;

          export default function App() {
            const [foo, setFoo] = useState(1);
            return <h1>A{foo}</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useState} = React;

          export default function App() {
            const [foo, setFoo] = useState(1);
            return <h1>B{foo}</h1>;
          }
        `);
        // Same initial state, so it's preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useState} = React;

          export default function App() {
            const [foo, setFoo] = useState(2);
            return <h1>C{foo}</h1>;
          }
        `);
        // Different initial state, so state is reset.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C2');
      }
    });

    // This is best effort for simple cases.
    // We won't attempt to resolve identifiers.
    it('resets state when useReducer initial state is edited', () => {
      if (__DEV__) {
        render(`
          const {useReducer} = React;

          export default function App() {
            const [foo, setFoo] = useReducer(x => x, 1);
            return <h1>A{foo}</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');

        patch(`
          const {useReducer} = React;

          export default function App() {
            const [foo, setFoo] = useReducer(x => x, 1);
            return <h1>B{foo}</h1>;
          }
        `);
        // Same initial state, so it's preserved.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B1');

        patch(`
          const {useReducer} = React;

          export default function App() {
            const [foo, setFoo] = useReducer(x => x, 2);
            return <h1>C{foo}</h1>;
          }
        `);
        // Different initial state, so state is reset.
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C2');
      }
    });

    it('remounts when switching export from function to class', () => {
      if (__DEV__) {
        render(`
          export default function App() {
            return <h1>A1</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          export default function App() {
            return <h1>A2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('A2');

        patch(`
          export default class App extends React.Component {
            render() {
              return <h1>B1</h1>
            }
          }
        `);
        // Reset (function -> class).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B1');
        patch(`
          export default class App extends React.Component {
            render() {
              return <h1>B2</h1>
            }
          }
        `);
        // Reset (classes always do).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B2');

        patch(`
          export default function App() {
            return <h1>C1</h1>;
          }
        `);
        // Reset (class -> function).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C1');
        patch(`
          export default function App() {
            return <h1>C2</h1>;
          }
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('C2');

        patch(`
          export default function App() {
            return <h1>D1</h1>;
          }
        `);
        el = container.firstChild;
        expect(el.textContent).toBe('D1');
        patch(`
          export default function App() {
            return <h1>D2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('D2');
      }
    });

    it('remounts when switching export from class to function', () => {
      if (__DEV__) {
        render(`
          export default class App extends React.Component {
            render() {
              return <h1>A1</h1>
            }
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          export default class App extends React.Component {
            render() {
              return <h1>A2</h1>
            }
          }
        `);
        // Reset (classes always do).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('A2');

        patch(`
          export default function App() {
            return <h1>B1</h1>;
          }
        `);
        // Reset (class -> function).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B1');
        patch(`
          export default function App() {
            return <h1>B2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');

        patch(`
          export default class App extends React.Component {
            render() {
              return <h1>C1</h1>
            }
          }
        `);
        // Reset (function -> class).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C1');
      }
    });

    it('remounts when wrapping export in a HOC', () => {
      if (__DEV__) {
        render(`
          export default function App() {
            return <h1>A1</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          export default function App() {
            return <h1>A2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('A2');

        patch(`
          function hoc(Inner) {
            return function Wrapper() {
              return <Inner />;
            }
          }

          function App() {
            return <h1>B1</h1>;
          }

          export default hoc(App);
        `);
        // Reset (wrapped in HOC).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B1');
        patch(`
          function hoc(Inner) {
            return function Wrapper() {
              return <Inner />;
            }
          }

          function App() {
            return <h1>B2</h1>;
          }

          export default hoc(App);
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');

        patch(`
          export default function App() {
            return <h1>C1</h1>;
          }
        `);
        // Reset (unwrapped).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C1');
        patch(`
          export default function App() {
            return <h1>C2</h1>;
          }
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('C2');
      }
    });

    it('remounts when wrapping export in memo()', () => {
      if (__DEV__) {
        render(`
          export default function App() {
            return <h1>A1</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          export default function App() {
            return <h1>A2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('A2');

        patch(`
          function App() {
            return <h1>B1</h1>;
          }

          export default React.memo(App);
        `);
        // Reset (wrapped in HOC).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B1');
        patch(`
          function App() {
            return <h1>B2</h1>;
          }

          export default React.memo(App);
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');

        patch(`
          export default function App() {
            return <h1>C1</h1>;
          }
        `);
        // Reset (unwrapped).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C1');
        patch(`
          export default function App() {
            return <h1>C2</h1>;
          }
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('C2');
      }
    });

    it('remounts when wrapping export in forwardRef()', () => {
      if (__DEV__) {
        render(`
          export default function App() {
            return <h1>A1</h1>;
          }
        `);
        let el = container.firstChild;
        expect(el.textContent).toBe('A1');
        patch(`
          export default function App() {
            return <h1>A2</h1>;
          }
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('A2');

        patch(`
          function App() {
            return <h1>B1</h1>;
          }

          export default React.forwardRef(App);
        `);
        // Reset (wrapped in HOC).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('B1');
        patch(`
          function App() {
            return <h1>B2</h1>;
          }

          export default React.forwardRef(App);
        `);
        // Keep state.
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('B2');

        patch(`
          export default function App() {
            return <h1>C1</h1>;
          }
        `);
        // Reset (unwrapped).
        expect(container.firstChild).not.toBe(el);
        el = container.firstChild;
        expect(el.textContent).toBe('C1');
        patch(`
          export default function App() {
            return <h1>C2</h1>;
          }
        `);
        expect(container.firstChild).toBe(el);
        expect(el.textContent).toBe('C2');
      }
    });

    if (!require('shared/ReactFeatureFlags').disableModulePatternComponents) {
      it('remounts deprecated factory components', () => {
        if (__DEV__) {
          expect(() => {
            render(`
              function Parent() {
                return {
                  render() {
                    return <Child prop="A" />;
                  }
                };
              };

              function Child({prop}) {
                return <h1>{prop}1</h1>;
              };

              export default Parent;
            `);
          }).toErrorDev(
            'The <Parent /> component appears to be a function component ' +
              'that returns a class instance.',
          );
          const el = container.firstChild;
          expect(el.textContent).toBe('A1');
          patch(`
            function Parent() {
              return {
                render() {
                  return <Child prop="B" />;
                }
              };
            };

            function Child({prop}) {
              return <h1>{prop}2</h1>;
            };

            export default Parent;
          `);
          // Like classes, factory components always remount.
          expect(container.firstChild).not.toBe(el);
          const newEl = container.firstChild;
          expect(newEl.textContent).toBe('B2');
        }
      });
    }

    describe('with inline requires', () => {
      beforeEach(() => {
        global.FakeModuleSystem = {};
      });

      afterEach(() => {
        delete global.FakeModuleSystem;
      });

      it('remounts component if custom hook it uses changes order on first edit', () => {
        // This test verifies that remounting works even if calls to custom Hooks
        // were transformed with an inline requires transform, like we have on RN.
        // Inline requires make it harder to compare previous and next signatures
        // because useFancyState inline require always resolves to the newest version.
        // We're not actually using inline requires in the test, but it has similar semantics.
        if (__DEV__) {
          render(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>A{x}{y}</h1>;
            };

            export default App;
          `);
          let el = container.firstChild;
          expect(el.textContent).toBe('AXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>B{x}{y}</h1>;
            };

            export default App;
          `);
          // The useFancyState Hook added an effect,
          // so we had to remount the component.
          expect(container.firstChild).not.toBe(el);
          el = container.firstChild;
          expect(el.textContent).toBe('BXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>C{x}{y}</h1>;
            };

            export default App;
          `);
          // We didn't change anything except the header text.
          // So we don't expect a remount.
          expect(container.firstChild).toBe(el);
          expect(el.textContent).toBe('CXY');
        }
      });

      it('remounts component if custom hook it uses changes order on second edit', () => {
        if (__DEV__) {
          render(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>A{x}{y}</h1>;
            };

            export default App;
          `);
          let el = container.firstChild;
          expect(el.textContent).toBe('AXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>B{x}{y}</h1>;
            };

            export default App;
          `);
          expect(container.firstChild).toBe(el);
          expect(el.textContent).toBe('BXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>C{x}{y}</h1>;
            };

            export default App;
          `);
          // The useFancyState Hook added an effect,
          // so we had to remount the component.
          expect(container.firstChild).not.toBe(el);
          el = container.firstChild;
          expect(el.textContent).toBe('CXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>D{x}{y}</h1>;
            };

            export default App;
          `);
          // We didn't change anything except the header text.
          // So we don't expect a remount.
          expect(container.firstChild).toBe(el);
          expect(el.textContent).toBe('DXY');
        }
      });

      it('recovers if evaluating Hook list throws', () => {
        if (__DEV__) {
          render(`
          let FakeModuleSystem = null;

          global.FakeModuleSystem.useFancyState = function(initialState) {
            return React.useState(initialState);
          };

          const App = () => {
            FakeModuleSystem = global.FakeModuleSystem;
            const [x, setX] = FakeModuleSystem.useFancyState('X');
            const [y, setY] = FakeModuleSystem.useFancyState('Y');
            return <h1>A{x}{y}</h1>;
          };

          export default App;
        `);
          let el = container.firstChild;
          expect(el.textContent).toBe('AXY');

          patch(`
          let FakeModuleSystem = null;

          global.FakeModuleSystem.useFancyState = function(initialState) {
            React.useEffect(() => {});
            return React.useState(initialState);
          };

          const App = () => {
            FakeModuleSystem = global.FakeModuleSystem;
            const [x, setX] = FakeModuleSystem.useFancyState('X');
            const [y, setY] = FakeModuleSystem.useFancyState('Y');
            return <h1>B{x}{y}</h1>;
          };

          export default App;
        `);
          // We couldn't evaluate the Hook signatures
          // so we had to remount the component.
          expect(container.firstChild).not.toBe(el);
          el = container.firstChild;
          expect(el.textContent).toBe('BXY');
        }
      });

      it('remounts component if custom hook it uses changes order behind an indirection', () => {
        if (__DEV__) {
          render(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return FakeModuleSystem.useIndirection(initialState);
            };

            FakeModuleSystem.useIndirection = function(initialState) {
              return FakeModuleSystem.useOtherIndirection(initialState);
            };

            FakeModuleSystem.useOtherIndirection = function(initialState) {
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>A{x}{y}</h1>;
            };

            export default App;
          `);
          let el = container.firstChild;
          expect(el.textContent).toBe('AXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return FakeModuleSystem.useIndirection(initialState);
            };

            FakeModuleSystem.useIndirection = function(initialState) {
              return FakeModuleSystem.useOtherIndirection(initialState);
            };

            FakeModuleSystem.useOtherIndirection = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>B{x}{y}</h1>;
            };

            export default App;
          `);

          // The useFancyState Hook added an effect,
          // so we had to remount the component.
          expect(container.firstChild).not.toBe(el);
          el = container.firstChild;
          expect(el.textContent).toBe('BXY');

          patch(`
            const FakeModuleSystem = global.FakeModuleSystem;

            FakeModuleSystem.useFancyState = function(initialState) {
              return FakeModuleSystem.useIndirection(initialState);
            };

            FakeModuleSystem.useIndirection = function(initialState) {
              return FakeModuleSystem.useOtherIndirection(initialState);
            };

            FakeModuleSystem.useOtherIndirection = function(initialState) {
              React.useEffect(() => {});
              return React.useState(initialState);
            };

            const App = () => {
              const [x, setX] = FakeModuleSystem.useFancyState('X');
              const [y, setY] = FakeModuleSystem.useFancyState('Y');
              return <h1>C{x}{y}</h1>;
            };

            export default App;
          `);
          // We didn't change anything except the header text.
          // So we don't expect a remount.
          expect(container.firstChild).toBe(el);
          expect(el.textContent).toBe('CXY');
        }
      });
    });
  }
});
