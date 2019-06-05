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

let babel = require('babel-core');
let freshPlugin = require('react-fresh/babel');

describe('ReactFreshIntegration', () => {
  let container;
  let lastRoot;
  let scheduleHotUpdate;

  beforeEach(() => {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: injected => {
        scheduleHotUpdate = injected.scheduleHotUpdate;
      },
      onCommitFiberRoot: (id, root) => {
        lastRoot = root;
      },
      onCommitFiberUnmount: () => {},
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactFreshRuntime = require('react-fresh/runtime');
    act = require('react-dom/test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function execute(source) {
    const compiled = babel.transform(source, {
      babelrc: false,
      presets: ['react'],
      plugins: [freshPlugin, 'transform-es2015-modules-commonjs'],
    }).code;
    const exportsObj = {};
    // eslint-disable-next-line no-new-func
    new Function('React', 'exports', '__register__', '__signature__', compiled)(
      React,
      exportsObj,
      __register__,
      __signature__,
    );
    return exportsObj.default;
  }

  function render(source) {
    const Component = execute(source);
    act(() => {
      ReactDOM.render(<Component />, container);
    });
  }

  function patch(source) {
    execute(source);
    const hotUpdate = ReactFreshRuntime.prepareUpdate();
    act(() => {
      scheduleHotUpdate(lastRoot, hotUpdate);
    });
  }

  function __register__(type, id) {
    ReactFreshRuntime.register(type, id);
  }

  function __signature__(type, key, forceReset, getCustomHooks) {
    ReactFreshRuntime.setSignature(type, key, forceReset, getCustomHooks);
    return type;
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

        export default function App() {
          const [foo, setFoo] = useState(1);
          return <h1>A{foo}</h1>;
        }
      `);
      const el = container.firstChild;
      expect(el.textContent).toBe('A1');

      patch(`
        const {useState} = React;

        export default function App() {
          const [foo, setFoo] = useState('ignored');
          return <h1>B{foo}</h1>;
        }
      `);
      // Same state variable name, so state is preserved.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('B1');

      patch(`
        const {useState} = React;

        export default function App() {
          const [bar, setBar] = useState(2);
          return <h1>C{bar}</h1>;
        }
      `);
      // Different state variable name, so state is reset.
      expect(container.firstChild).not.toBe(el);
      const newEl = container.firstChild;
      expect(newEl.textContent).toBe('C2');
    }
  });

  it('resets state when renaming a state variable in a HOC', () => {
    if (__DEV__) {
      render(`
        const {useState} = React;

        function hoc(Wrapped) {
          return function Generated() {
            const [foo, setFoo] = useState(1);
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

        function hoc(Wrapped) {
          return function Generated() {
            const [foo, setFoo] = useState('ignored');
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

        function hoc(Wrapped) {
          return function Generated() {
            const [bar, setBar] = useState(2);
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
      expect(newEl.textContent).toBe('C2');
    }
  });

  it('resets state when renaming a state variable in a HOC with indirection', () => {
    if (__DEV__) {
      render(`
        const {useState} = React;

        function hoc(Wrapped) {
          return function Generated() {
            const [foo, setFoo] = useState(1);
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

        function hoc(Wrapped) {
          return function Generated() {
            const [foo, setFoo] = useState('ignored');
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

        function hoc(Wrapped) {
          return function Generated() {
            const [bar, setBar] = useState(2);
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
      expect(newEl.textContent).toBe('C2');
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

  it('resets state on every edit with @hot reset annotation', () => {
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
          const [foo, setFoo] = useState('ignored');
          return <h1>B{foo}</h1>;
        }
      `);
      // Same state variable name, so state is preserved.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('B1');

      patch(`
        const {useState} = React;

        /* @hot reset */

        export default function App() {
          const [bar, setBar] = useState(2);
          return <h1>C{bar}</h1>;
        }
      `);
      // Found remount annotation, so state is reset.
      expect(container.firstChild).not.toBe(el);
      el = container.firstChild;
      expect(el.textContent).toBe('C2');

      patch(`
        const {useState} = React;

        export default function App() {

          // @hot reset

          const [bar, setBar] = useState(3);
          return <h1>D{bar}</h1>;
        }
      `);
      // Found remount annotation, so state is reset.
      expect(container.firstChild).not.toBe(el);
      el = container.firstChild;
      expect(el.textContent).toBe('D3');

      patch(`
        const {useState} = React;

        export default function App() {
          const [bar, setBar] = useState(4);
          return <h1>E{bar}</h1>;
        }
      `);
      // There is no remount annotation anymore,
      // so preserve the previous state.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('E3');

      patch(`
        const {useState} = React;

        export default function App() {
          const [bar, setBar] = useState(4);
          return <h1>F{bar}</h1>;
        }
      `);
      // Continue editing.
      expect(container.firstChild).toBe(el);
      expect(el.textContent).toBe('F3');

      patch(`
        const {useState} = React;

        export default function App() {

          /* @hot reset */

          const [bar, setBar] = useState(5);
          return <h1>G{bar}</h1>;
        }
      `);
      // Force remount one last time.
      expect(container.firstChild).not.toBe(el);
      el = container.firstChild;
      expect(el.textContent).toBe('G5');
    }
  });
});
