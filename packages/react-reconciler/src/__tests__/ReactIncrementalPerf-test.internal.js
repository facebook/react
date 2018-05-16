/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

describe('ReactDebugFiberPerf', () => {
  let React;
  let ReactNoop;
  let PropTypes;

  let root;
  let activeMeasure;
  let knownMarks;
  let knownMeasures;
  let comments;

  function resetFlamechart() {
    root = {
      children: [],
      indent: -1,
      markName: null,
      label: null,
      parent: null,
      toString() {
        return this.children.map(c => c.toString()).join('\n');
      },
    };
    activeMeasure = root;
    knownMarks = new Set();
    knownMeasures = new Set();
    comments = [];
  }

  function addComment(comment) {
    comments.push(comment);
  }

  function getFlameChart() {
    // Make sure we unwind the measurement stack every time.
    expect(activeMeasure.indent).toBe(-1);
    expect(activeMeasure).toBe(root);
    // We should always clean them up because browsers
    // buffer user timing measurements forever.
    expect(knownMarks.size).toBe(0);
    expect(knownMeasures.size).toBe(0);
    return root.toString();
  }

  function createUserTimingPolyfill() {
    // This is not a true polyfill, but it gives us enough
    // to capture measurements in a readable tree-like output.
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
    return {
      mark(markName) {
        const measure = {
          children: [],
          indent: activeMeasure.indent + 1,
          markName: markName,
          // Will be assigned on measure() call:
          label: null,
          parent: activeMeasure,
          comments,
          toString() {
            return (
              [
                ...this.comments.map(c => '  '.repeat(this.indent) + '// ' + c),
                '  '.repeat(this.indent) + this.label,
                ...this.children.map(c => c.toString()),
              ].join('\n') +
              // Extra newline after each root reconciliation
              (this.indent === 0 ? '\n' : '')
            );
          },
        };
        comments = [];
        // Step one level deeper
        activeMeasure.children.push(measure);
        activeMeasure = measure;
        knownMarks.add(markName);
      },
      // We don't use the overload with three arguments.
      measure(label, markName) {
        if (markName !== activeMeasure.markName) {
          throw new Error('Unexpected measure() call.');
        }
        // Step one level up
        activeMeasure.label = label;
        activeMeasure = activeMeasure.parent;
        knownMeasures.add(label);
      },
      clearMarks(markName) {
        if (markName === activeMeasure.markName) {
          // Step one level up if we're in this measure
          activeMeasure = activeMeasure.parent;
          activeMeasure.children.length--;
        }
        knownMarks.delete(markName);
      },
      clearMeasures(label) {
        knownMeasures.delete(label);
      },
    };
  }

  beforeEach(() => {
    jest.resetModules();
    resetFlamechart();
    global.performance = createUserTimingPolyfill();

    require('shared/ReactFeatureFlags').enableUserTimingAPI = true;
    require('shared/ReactFeatureFlags').enableProfilerTimer = false;
    require('shared/ReactFeatureFlags').replayFailedUnitOfWorkWithInvokeGuardedCallback = false;

    // Import after the polyfill is set up:
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    PropTypes = require('prop-types');
  });

  afterEach(() => {
    delete global.performance;
  });

  function Parent(props) {
    return <div>{props.children}</div>;
  }

  function Child(props) {
    return <div>{props.children}</div>;
  }

  it('measures a simple reconciliation', () => {
    ReactNoop.render(
      <Parent>
        <Child />
      </Parent>,
    );
    addComment('Mount');
    ReactNoop.flush();

    ReactNoop.render(
      <Parent>
        <Child />
      </Parent>,
    );
    addComment('Update');
    ReactNoop.flush();

    ReactNoop.render(null);
    addComment('Unmount');
    ReactNoop.flush();

    expect(getFlameChart()).toMatchSnapshot();
  });

  it('properly displays the forwardRef component in measurements', () => {
    const AnonymousForwardRef = React.forwardRef((props, ref) => (
      <Child {...props} ref={ref} />
    ));
    const NamedForwardRef = React.forwardRef(function refForwarder(props, ref) {
      return <Child {...props} ref={ref} />;
    });
    function notImportant(props, ref) {
      return <Child {...props} ref={ref} />;
    }
    notImportant.displayName = 'OverriddenName';
    const DisplayNamedForwardRef = React.forwardRef(notImportant);

    ReactNoop.render(
      <Parent>
        <AnonymousForwardRef />
        <NamedForwardRef />
        <DisplayNamedForwardRef />
      </Parent>,
    );
    addComment('Mount');
    ReactNoop.flush();

    expect(getFlameChart()).toMatchSnapshot();
  });

  it('does not include AsyncMode, StrictMode, or Profiler components in measurements', () => {
    ReactNoop.render(
      <React.unstable_Profiler id="test" onRender={jest.fn()}>
        <React.StrictMode>
          <Parent>
            <React.unstable_AsyncMode>
              <Child />
            </React.unstable_AsyncMode>
          </Parent>
        </React.StrictMode>
      </React.unstable_Profiler>,
    );
    addComment('Mount');
    ReactNoop.flush();

    expect(getFlameChart()).toMatchSnapshot();
  });

  it('does not include context provider or consumer in measurements', () => {
    const {Consumer, Provider} = React.createContext(true);

    ReactNoop.render(
      <Provider value={false}>
        <Parent>
          <Consumer>{value => <Child value={value} />}</Consumer>
        </Parent>
      </Provider>,
    );
    addComment('Mount');
    ReactNoop.flush();

    expect(getFlameChart()).toMatchSnapshot();
  });

  it('skips parents during setState', () => {
    class A extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class B extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    let a;
    let b;
    ReactNoop.render(
      <Parent>
        <Parent>
          <Parent>
            <A ref={inst => (a = inst)} />
          </Parent>
        </Parent>
        <Parent>
          <B ref={inst => (b = inst)} />
        </Parent>
      </Parent>,
    );
    ReactNoop.flush();
    resetFlamechart();

    a.setState({});
    b.setState({});
    addComment('Should include just A and B, no Parents');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('warns on cascading renders from setState', () => {
    class Cascading extends React.Component {
      componentDidMount() {
        this.setState({});
      }
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    ReactNoop.render(
      <Parent>
        <Cascading />
      </Parent>,
    );
    addComment('Should print a warning');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('warns on cascading renders from top-level render', () => {
    class Cascading extends React.Component {
      componentDidMount() {
        ReactNoop.renderToRootWithID(<Child />, 'b');
        addComment('Scheduling another root from componentDidMount');
        ReactNoop.flush();
      }
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    ReactNoop.renderToRootWithID(<Cascading />, 'a');
    addComment('Rendering the first root');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('does not treat setState from cWM or cWRP as cascading', () => {
    class NotCascading extends React.Component {
      UNSAFE_componentWillMount() {
        this.setState({});
      }
      UNSAFE_componentWillReceiveProps() {
        this.setState({});
      }
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    ReactNoop.render(
      <Parent>
        <NotCascading />
      </Parent>,
    );
    addComment('Should not print a warning');
    expect(ReactNoop.flush).toWarnDev([
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: NotCascading' +
        '\n\ncomponentWillReceiveProps: Please update the following components ' +
        'to use static getDerivedStateFromProps instead: NotCascading',
    ]);
    ReactNoop.render(
      <Parent>
        <NotCascading />
      </Parent>,
    );
    addComment('Should not print a warning');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('captures all lifecycles', () => {
    class AllLifecycles extends React.Component {
      static childContextTypes = {
        foo: PropTypes.any,
      };
      shouldComponentUpdate() {
        return true;
      }
      getChildContext() {
        return {foo: 42};
      }
      UNSAFE_componentWillMount() {}
      componentDidMount() {}
      UNSAFE_componentWillReceiveProps() {}
      UNSAFE_componentWillUpdate() {}
      componentDidUpdate() {}
      componentWillUnmount() {}
      render() {
        return <div />;
      }
    }
    ReactNoop.render(<AllLifecycles />);
    addComment('Mount');
    expect(ReactNoop.flush).toWarnDev(
      'componentWillMount: Please update the following components ' +
        'to use componentDidMount instead: AllLifecycles' +
        '\n\ncomponentWillReceiveProps: Please update the following components ' +
        'to use static getDerivedStateFromProps instead: AllLifecycles' +
        '\n\ncomponentWillUpdate: Please update the following components ' +
        'to use componentDidUpdate instead: AllLifecycles',
    );
    ReactNoop.render(<AllLifecycles />);
    addComment('Update');
    ReactNoop.flush();
    ReactNoop.render(null);
    addComment('Unmount');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('measures deprioritized work', () => {
    addComment('Flush the parent');
    ReactNoop.flushSync(() => {
      ReactNoop.render(
        <Parent>
          <div hidden={true}>
            <Child />
          </div>
        </Parent>,
      );
    });
    addComment('Flush the child');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('measures deferred work in chunks', () => {
    class A extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class B extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    ReactNoop.render(
      <Parent>
        <A>
          <Child />
        </A>
        <B>
          <Child />
        </B>
      </Parent>,
    );
    addComment('Start mounting Parent and A');
    ReactNoop.flushDeferredPri(40);
    addComment('Mount B just a little (but not enough to memoize)');
    ReactNoop.flushDeferredPri(10);
    addComment('Complete B and Parent');
    ReactNoop.flushDeferredPri();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('recovers from fatal errors', () => {
    function Baddie() {
      throw new Error('Game over');
    }

    ReactNoop.render(
      <Parent>
        <Baddie />
      </Parent>,
    );
    try {
      addComment('Will fatal');
      ReactNoop.flush();
    } catch (err) {
      expect(err.message).toBe('Game over');
    }
    ReactNoop.render(
      <Parent>
        <Child />
      </Parent>,
    );
    addComment('Will reconcile from a clean state');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('recovers from caught errors', () => {
    function Baddie() {
      throw new Error('Game over');
    }

    function ErrorReport() {
      return <div />;
    }

    class Boundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          return <ErrorReport />;
        }
        return this.props.children;
      }
    }

    ReactNoop.render(
      <Parent>
        <Boundary>
          <Parent>
            <Baddie />
          </Parent>
        </Boundary>
      </Parent>,
    );
    addComment('Stop on Baddie and restart from Boundary');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('deduplicates lifecycle names during commit to reduce overhead', () => {
    class A extends React.Component {
      componentDidUpdate() {}
      render() {
        return <div />;
      }
    }

    class B extends React.Component {
      componentDidUpdate(prevProps) {
        if (this.props.cascade && !prevProps.cascade) {
          this.setState({});
        }
      }
      render() {
        return <div />;
      }
    }

    ReactNoop.render(
      <Parent>
        <A />
        <B />
        <A />
        <B />
      </Parent>,
    );
    ReactNoop.flush();
    resetFlamechart();

    ReactNoop.render(
      <Parent>
        <A />
        <B />
        <A />
        <B />
      </Parent>,
    );
    addComment('The commit phase should mention A and B just once');
    ReactNoop.flush();
    ReactNoop.render(
      <Parent>
        <A />
        <B />
        <A />
        <B cascade={true} />
      </Parent>,
    );
    addComment("Because of deduplication, we don't know B was cascading,");
    addComment('but we should still see the warning for the commit phase.');
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('supports portals', () => {
    const noopContainer = {children: []};
    ReactNoop.render(
      <Parent>{ReactNoop.createPortal(<Child />, noopContainer, null)}</Parent>,
    );
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('does not schedule an extra callback if setState is called during a synchronous commit phase', () => {
    class Component extends React.Component {
      state = {step: 1};
      componentDidMount() {
        this.setState({step: 2});
      }
      render() {
        return <span prop={this.state.step} />;
      }
    }
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Component />);
    });
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('warns if an in-progress update is interrupted', () => {
    function Foo() {
      return <span />;
    }

    ReactNoop.render(<Foo />);
    ReactNoop.flushUnitsOfWork(2);
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Foo />);
    });
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });

  it('warns if async work expires (starvation)', () => {
    function Foo() {
      return <span />;
    }

    ReactNoop.render(<Foo />);
    ReactNoop.expire(6000);
    ReactNoop.flush();
    expect(getFlameChart()).toMatchSnapshot();
  });
});
