/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactTestRenderer;
let Scheduler;
let act;

describe('ReactDoubleInvokeEvents', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');
    act = ReactTestRenderer.unstable_concurrentAct;
  });

  function supportsDoubleInvokeEffects() {
    return gate(
      flags =>
        flags.build === 'development' && flags.enableDoubleInvokingEffects,
    );
  }

  it('should not double invoke effects in legacy mode', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      return text;
    }

    act(() => {
      ReactTestRenderer.create(<App text={'mount'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect mount',
      'useEffect mount',
    ]);
  });

  it('double invoking for effects works properly', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      return text;
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    act(() => {
      renderer.update(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    act(() => {
      renderer.unmount();
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });

  it('multiple effects are double invoked in the right order (all mounted, all unmounted, all remounted)', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect One mount');
        return () => Scheduler.unstable_yieldValue('useEffect One unmount');
      });

      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect Two mount');
        return () => Scheduler.unstable_yieldValue('useEffect Two unmount');
      });

      return text;
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'useEffect One mount',
        'useEffect Two mount',
        'useEffect One unmount',
        'useEffect Two unmount',
        'useEffect One mount',
        'useEffect Two mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useEffect One mount',
        'useEffect Two mount',
      ]);
    }

    act(() => {
      renderer.update(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useEffect One unmount',
      'useEffect Two unmount',
      'useEffect One mount',
      'useEffect Two mount',
    ]);

    act(() => {
      renderer.unmount(null);
    });

    expect(Scheduler).toHaveYielded([
      'useEffect One unmount',
      'useEffect Two unmount',
    ]);
  });

  it('multiple layout effects are double invoked in the right order (all mounted, all unmounted, all remounted)', () => {
    function App({text}) {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect One mount');
        return () =>
          Scheduler.unstable_yieldValue('useLayoutEffect One unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect Two mount');
        return () =>
          Scheduler.unstable_yieldValue('useLayoutEffect Two unmount');
      });

      return text;
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
        'useLayoutEffect One unmount',
        'useLayoutEffect Two unmount',
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect One mount',
        'useLayoutEffect Two mount',
      ]);
    }

    act(() => {
      renderer.update(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect One unmount',
      'useLayoutEffect Two unmount',
      'useLayoutEffect One mount',
      'useLayoutEffect Two mount',
    ]);

    act(() => {
      renderer.unmount();
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect One unmount',
      'useLayoutEffect Two unmount',
    ]);
  });

  it('useEffect and useLayoutEffect is called twice when there is no unmount', () => {
    function App({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
      });

      return text;
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    act(() => {
      renderer.update(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect mount',
      'useEffect mount',
    ]);

    act(() => {
      renderer.unmount();
    });

    expect(Scheduler).toHaveYielded([]);
  });

  it('passes the right context to class component lifecycles', () => {
    class App extends React.PureComponent {
      test() {}

      componentDidMount() {
        this.test();
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentDidUpdate() {
        this.test();
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }

      componentWillUnmount() {
        this.test();
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return null;
      }
    }

    act(() => {
      ReactTestRenderer.create(<App />, {unstable_isConcurrent: true});
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded(['componentDidMount']);
    }
  });

  it('double invoking works for class components', () => {
    class App extends React.PureComponent {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'componentWillUnmount',
        'componentDidMount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded(['componentDidMount']);
    }

    act(() => {
      renderer.update(<App text={'update'} />);
    });

    expect(Scheduler).toHaveYielded(['componentDidUpdate']);

    act(() => {
      renderer.unmount();
    });

    expect(Scheduler).toHaveYielded(['componentWillUnmount']);
  });

  it('should not double invoke class lifecycles in legacy mode', () => {
    class App extends React.PureComponent {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    act(() => {
      ReactTestRenderer.create(<App text={'mount'} />);
    });

    expect(Scheduler).toHaveYielded(['componentDidMount']);
  });

  it('double flushing passive effects only results in one double invoke', () => {
    function App({text}) {
      const [state, setState] = React.useState(0);
      React.useEffect(() => {
        if (state !== 1) {
          setState(1);
        }
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });

      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });

      Scheduler.unstable_yieldValue(text);
      return text;
    }

    act(() => {
      ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'mount',
        'useLayoutEffect mount',
        'useEffect mount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'useLayoutEffect mount',
        'useEffect mount',
        'mount',
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'mount',
        'useLayoutEffect mount',
        'useEffect mount',
        'mount',
        'useLayoutEffect unmount',
        'useLayoutEffect mount',
        'useEffect unmount',
        'useEffect mount',
      ]);
    }
  });

  it('newly mounted components after initial mount get double invoked', () => {
    let _setShowChild;
    function Child() {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('Child useEffect mount');
        return () => Scheduler.unstable_yieldValue('Child useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Child useLayoutEffect mount');
        return () =>
          Scheduler.unstable_yieldValue('Child useLayoutEffect unmount');
      });

      return null;
    }

    function App() {
      const [showChild, setShowChild] = React.useState(false);
      _setShowChild = setShowChild;
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('App useEffect mount');
        return () => Scheduler.unstable_yieldValue('App useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('App useLayoutEffect mount');
        return () =>
          Scheduler.unstable_yieldValue('App useLayoutEffect unmount');
      });

      return showChild && <Child />;
    }

    act(() => {
      ReactTestRenderer.create(<App />, {unstable_isConcurrent: true});
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect mount',
        'App useEffect mount',
        'App useLayoutEffect unmount',
        'App useEffect unmount',
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect mount',
        'App useEffect mount',
      ]);
    }

    act(() => {
      _setShowChild(true);
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect unmount',
        'Child useLayoutEffect mount',
        'App useLayoutEffect mount',
        'App useEffect unmount',
        'Child useEffect mount',
        'App useEffect mount',
        'Child useLayoutEffect unmount',
        'Child useEffect unmount',
        'Child useLayoutEffect mount',
        'Child useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'App useLayoutEffect unmount',
        'Child useLayoutEffect mount',
        'App useLayoutEffect mount',
        'App useEffect unmount',
        'Child useEffect mount',
        'App useEffect mount',
      ]);
    }
  });

  it('classes and functions are double invoked together correctly', () => {
    class ClassChild extends React.PureComponent {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }

      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }

      render() {
        return this.props.text;
      }
    }

    function FunctionChild({text}) {
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('useEffect mount');
        return () => Scheduler.unstable_yieldValue('useEffect unmount');
      });
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('useLayoutEffect mount');
        return () => Scheduler.unstable_yieldValue('useLayoutEffect unmount');
      });
      return text;
    }

    function App({text}) {
      return (
        <>
          <ClassChild text={text} />
          <FunctionChild text={text} />
        </>
      );
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<App text={'mount'} />, {
        unstable_isConcurrent: true,
      });
    });

    if (supportsDoubleInvokeEffects()) {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
        'componentWillUnmount',
        'useLayoutEffect unmount',
        'useEffect unmount',
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    } else {
      expect(Scheduler).toHaveYielded([
        'componentDidMount',
        'useLayoutEffect mount',
        'useEffect mount',
      ]);
    }

    act(() => {
      renderer.update(<App text={'mount'} />);
    });

    expect(Scheduler).toHaveYielded([
      'useLayoutEffect unmount',
      'useLayoutEffect mount',
      'useEffect unmount',
      'useEffect mount',
    ]);

    act(() => {
      renderer.unmount();
    });

    expect(Scheduler).toHaveYielded([
      'componentWillUnmount',
      'useLayoutEffect unmount',
      'useEffect unmount',
    ]);
  });
});
