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
    new Function('React', 'exports', '__register__', compiled)(
      React,
      exportsObj,
      __register__,
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
    scheduleHotUpdate(lastRoot, hotUpdate);
  }

  function __register__(type, id) {
    ReactFreshRuntime.register(type, id);
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
});
