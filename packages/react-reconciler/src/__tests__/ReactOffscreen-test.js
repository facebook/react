/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */
'use strict';

let React;
let ReactNoop;
let Scheduler;

describe('ReactOffscreen', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function createChild(name) {
    return ({children}) => {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue(`${name} passive effect`);
        return () => {
          Scheduler.unstable_yieldValue(`${name} passive destroy`);
        };
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(`${name} layout effect`);
        return () => {
          Scheduler.unstable_yieldValue(`${name} layout destroy`);
        };
      }, []);

      Scheduler.unstable_yieldValue(`${name}`);
      return (
        <>
          <span
            ref={element => {
              Scheduler.unstable_yieldValue(
                element === null
                  ? `${name} Ref null`
                  : `${name} Ref ${element.type}`,
              );
            }}>
            {name}
          </span>
          {children}
        </>
      );
    };
  }

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('should show subtrees/mount effects/attachRefs if shown and hide subtrees/unmount effects/detachRefs if hidden', async () => {
    const ChildOne = createChild('ChildOne');
    const ChildTwo = createChild('ChildTwo');
    const ChildThree = createChild('ChildThree');
    let _setMode;
    let _setText;
    function App() {
      const [mode, setMode] = React.useState('visible');
      const [text, setText] = React.useState('Child');
      _setMode = setMode;
      _setText = setText;
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('App passive effect');
        return () => {
          Scheduler.unstable_yieldValue('App passive destroy');
        };
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('App layout effect');
        return () => {
          Scheduler.unstable_yieldValue('App layout destroy');
        };
      });

      Scheduler.unstable_yieldValue('App');
      return (
        <>
          <div>Always Visible</div>
          <React.unstable_Offscreen mode={mode}>
            <ChildOne text={text}>
              <ChildTwo text={text} />
            </ChildOne>
            <ChildThree text={text} />
          </React.unstable_Offscreen>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });

    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne',
      'ChildTwo',
      'ChildThree',
      'ChildOne Ref span',
      'ChildTwo Ref span',
      'ChildTwo layout effect',
      'ChildOne layout effect',
      'ChildThree Ref span',
      'ChildThree layout effect',
      'App layout effect',
      'ChildTwo passive effect',
      'ChildOne passive effect',
      'ChildThree passive effect',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span>ChildOne</span>
        <span>ChildTwo</span>
        <span>ChildThree</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setMode('hidden'));
    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne layout destroy',
      'ChildOne Ref null',
      'ChildTwo layout destroy',
      'ChildTwo Ref null',
      'ChildThree layout destroy',
      'ChildThree Ref null',
      'App layout destroy',
      'App layout effect',
      'App passive destroy',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span hidden={true}>ChildOne</span>
        <span hidden={true}>ChildTwo</span>
        <span hidden={true}>ChildThree</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setText('New Text'));
    expect(Scheduler).toHaveYielded([
      'App',
      'App layout destroy',
      'App layout effect',
      'App passive destroy',
      'App passive effect',
    ]);

    ReactNoop.act(() => _setMode('visible'));
    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne',
      'ChildTwo',
      'ChildThree',
      'ChildOne Ref null',
      'ChildTwo Ref null',
      'ChildThree Ref null',
      'App layout destroy',
      'ChildOne Ref span',
      'ChildTwo Ref span',
      'ChildTwo layout effect',
      'ChildOne layout effect',
      'ChildThree Ref span',
      'ChildThree layout effect',
      'App layout effect',
      'ChildTwo passive destroy',
      'ChildOne passive destroy',
      'ChildThree passive destroy',
      'App passive destroy',
      'ChildTwo passive effect',
      'ChildOne passive effect',
      'ChildThree passive effect',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span>ChildOne</span>
        <span>ChildTwo</span>
        <span>ChildThree</span>
      </React.Fragment>,
    );
  });

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('should unmount all layout effects as well as passive effects when cleanupPassiveEffects is true', async () => {
    const ChildOne = createChild('ChildOne');
    let _setMode;
    let _setText;
    function App() {
      const [mode, setMode] = React.useState('visible');
      const [text, setText] = React.useState('Child');
      _setMode = setMode;
      _setText = setText;
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('App passive effect');
        return () => {
          Scheduler.unstable_yieldValue('App passive destroy');
        };
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('App layout effect');
        return () => {
          Scheduler.unstable_yieldValue('App layout destroy');
        };
      });

      Scheduler.unstable_yieldValue('App');
      return (
        <>
          <div>Always Visible</div>
          <React.unstable_Offscreen mode={mode} cleanupPassiveEffects={true}>
            <ChildOne text={text} />
          </React.unstable_Offscreen>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne',
      'ChildOne Ref span',
      'ChildOne layout effect',
      'App layout effect',
      'ChildOne passive effect',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span>ChildOne</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setMode('hidden'));
    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne layout destroy',
      'ChildOne Ref null',

      'App layout destroy',
      'App layout effect',
      'ChildOne passive destroy',
      'App passive destroy',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span hidden={true}>ChildOne</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setText('New Text'));
    expect(Scheduler).toHaveYielded([
      'App',
      'App layout destroy',
      'App layout effect',
      'App passive destroy',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span hidden={true}>ChildOne</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setMode('visible'));
    expect(Scheduler).toHaveYielded([
      'App',
      'ChildOne',
      'ChildOne Ref null',
      'App layout destroy',
      'ChildOne Ref span',
      'ChildOne layout effect',
      'App layout effect',
      'App passive destroy',
      'ChildOne passive effect',
      'App passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <div>Always Visible</div>
        <span>ChildOne</span>
      </React.Fragment>,
    );
  });

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('Nested Offscreen components behave properly', async () => {
    const ChildOne = createChild('ChildOne');
    const ChildTwo = createChild('ChildTwo');
    let _setMode;
    let _setNestedMode;
    function App() {
      const [mode, setMode] = React.useState('visible');
      const [nestedMode, setNestedMode] = React.useState('visible');
      _setMode = setMode;
      _setNestedMode = setNestedMode;
      return (
        <React.unstable_Offscreen mode={mode}>
          <ChildOne />
          <React.unstable_Offscreen mode={nestedMode}>
            <ChildTwo />
          </React.unstable_Offscreen>
        </React.unstable_Offscreen>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([
      'ChildOne',
      'ChildTwo',
      'ChildOne Ref span',
      'ChildOne layout effect',
      'ChildTwo Ref span',
      'ChildTwo layout effect',
      'ChildOne passive effect',
      'ChildTwo passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span>ChildOne</span>
        <span>ChildTwo</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setNestedMode('hidden'));
    expect(Scheduler).toHaveYielded([
      'ChildOne',
      'ChildOne Ref null',
      'ChildTwo layout destroy',
      'ChildTwo Ref null',
      'ChildOne Ref span',
      'ChildOne passive destroy',
      'ChildOne passive effect',
    ]);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span>ChildOne</span>
        <span hidden={true}>ChildTwo</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setMode('hidden'));
    expect(Scheduler).toHaveYielded([
      'ChildOne layout destroy',
      'ChildOne Ref null',
    ]);

    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span hidden={true}>ChildOne</span>
        <span hidden={true}>ChildTwo</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setNestedMode('visible'));
    expect(Scheduler).toHaveYielded([]);

    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span hidden={true}>ChildOne</span>
        <span hidden={true}>ChildTwo</span>
      </React.Fragment>,
    );

    ReactNoop.act(() => _setMode('visible'));
    expect(Scheduler).toHaveYielded([
      'ChildOne',
      'ChildTwo',
      'ChildOne Ref null',
      'ChildTwo Ref null',
      'ChildOne Ref span',
      'ChildOne layout effect',
      'ChildTwo Ref span',
      'ChildTwo layout effect',
      'ChildOne passive destroy',
      'ChildTwo passive destroy',
      'ChildOne passive effect',
      'ChildTwo passive effect',
    ]);

    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span>ChildOne</span>
        <span>ChildTwo</span>
      </React.Fragment>,
    );
  });

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('should show/hide subtrees and mount/unmount refs for Class Components', async () => {
    class ChildOne extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('ChildOne componentDidMount');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('ChildOne componentWillUnmount');
      }

      render() {
        Scheduler.unstable_yieldValue('ChildOne render');
        return (
          <span
            ref={element =>
              Scheduler.unstable_yieldValue(
                element === null ? 'span Ref null' : `span Ref ${element.type}`,
              )
            }>
            ChildOne
          </span>
        );
      }
    }

    let AppInstance;
    class App extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          mode: false,
        };
        AppInstance = this;
      }

      componentDidMount() {
        Scheduler.unstable_yieldValue('App componentDidMount');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('App componentWillUnmount');
      }

      render() {
        Scheduler.unstable_yieldValue('App render');
        return (
          <React.unstable_Offscreen mode={this.state.mode}>
            <ChildOne
              ref={element => {
                Scheduler.unstable_yieldValue(
                  element === null
                    ? 'ChildOne Ref null'
                    : `ChildOne Ref ${element.constructor.name}`,
                );
              }}
            />
          </React.unstable_Offscreen>
        );
      }
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([
      'App render',
      'ChildOne render',
      'span Ref span',
      'ChildOne componentDidMount',
      'ChildOne Ref ChildOne',
      'App componentDidMount',
    ]);
    expect(root).toMatchRenderedOutput(<span>ChildOne</span>);

    ReactNoop.act(() => AppInstance.setState({mode: 'hidden'}));
    expect(Scheduler).toHaveYielded([
      'App render',
      'ChildOne Ref null',
      'ChildOne componentWillUnmount',
      'span Ref null',
    ]);
    expect(root).toMatchRenderedOutput(<span hidden={true}>ChildOne</span>);

    ReactNoop.act(() => AppInstance.setState({mode: 'visible'}));
    expect(Scheduler).toHaveYielded([
      'App render',
      'ChildOne render',
      'span Ref null',
      'ChildOne Ref null',
      'span Ref span',
      'ChildOne componentDidMount',
      'ChildOne Ref ChildOne',
    ]);
    expect(root).toMatchRenderedOutput(<span>ChildOne</span>);
  });

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('Forward refs are mounted/unmounted when hidden/visible', async () => {
    const Child = React.forwardRef((props, ref) => <span ref={ref} />);

    let _ref;
    let _setMode;
    function App() {
      const ref = React.useRef();
      const [mode, setMode] = React.useState('visible');
      _ref = ref;
      _setMode = setMode;
      return (
        <React.unstable_Offscreen mode={mode}>
          <Child ref={ref} />
        </React.unstable_Offscreen>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(_ref.current.type).toEqual('span');

    ReactNoop.act(() => _setMode('hidden'));
    expect(_ref.current).toBe(null);

    ReactNoop.act(() => _setMode('visible'));
    expect(_ref.current.type).toEqual('span');
  });

  // @gate enableHiddenAPI && runAllPassiveEffectDestroysBeforeCreates
  it('Portals are hidden in hidden subtrees and shown in visible ones', async () => {
    const portalContainer = ReactNoop.getOrCreateRootContainer(
      'portalContainer',
    );
    function Modal({portalRef, mode}) {
      React.useLayoutEffect(() => {
        portalContainer.hidden = true;
        return () => {
          portalContainer.hidden = false;
        };
      });
      return ReactNoop.createPortal(
        <span ref={portalRef}>
          <div>Child</div>
          {mode}
        </span>,
        portalContainer,
      );
    }

    let _setMode;
    function App() {
      const ref = React.useRef();
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue(
          `Portal Child Ref ${
            ref.current === null || ref.current.hidden ? 'hidden' : 'visible'
          }`,
        );
      });

      const [mode, setMode] = React.useState('visible');
      _setMode = setMode;
      return (
        <React.unstable_Offscreen mode={mode}>
          <div>
            <div>
              <Modal mode={mode} portalRef={ref} />
            </div>
          </div>
        </React.unstable_Offscreen>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Portal Child Ref visible']);
    expect(root).toMatchRenderedOutput(
      <div>
        <div />
      </div>,
    );
    expect(ReactNoop.getChildrenAsJSX('portalContainer')).toEqual(
      <span>
        <div>Child</div>
        visible
      </span>,
    );
    ReactNoop.act(() => _setMode('hidden'));
    expect(Scheduler).toHaveYielded(['Portal Child Ref hidden']);
    expect(root).toMatchRenderedOutput(
      <div hidden={true}>
        <div />
      </div>,
    );
    expect(ReactNoop.getChildrenAsJSX('portalContainer')).toEqual(
      <span hidden={true}>
        <div>Child</div>
        visible
      </span>,
    );

    ReactNoop.act(() => _setMode('visible'));
    expect(Scheduler).toHaveYielded(['Portal Child Ref visible']);
    expect(root).toMatchRenderedOutput(
      <div>
        <div />
      </div>,
    );
    expect(ReactNoop.getChildrenAsJSX('portalContainer')).toEqual(
      <span>
        <div>Child</div>
        visible
      </span>,
    );
  });
});
