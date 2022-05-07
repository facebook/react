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
let ReactDOM;
let ReactDOMClient;
let Scheduler;
let act;
let container;

describe('ReactSuspenseEffectsSemanticsDOM', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('jest-react').act;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function fakeImport(result) {
    return {default: result};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  it('should not cause a cycle when combined with a render phase update', () => {
    let scheduleSuspendingUpdate;

    function App() {
      const [value, setValue] = React.useState(true);

      scheduleSuspendingUpdate = () => setValue(!value);

      return (
        <>
          <React.Suspense fallback="Loading...">
            <ComponentThatCausesBug value={value} />
            <ComponentThatSuspendsOnUpdate shouldSuspend={!value} />
          </React.Suspense>
        </>
      );
    }

    function ComponentThatCausesBug({value}) {
      const [mirroredValue, setMirroredValue] = React.useState(value);
      if (mirroredValue !== value) {
        setMirroredValue(value);
      }

      // eslint-disable-next-line no-unused-vars
      const [_, setRef] = React.useState(null);

      return <div ref={setRef} />;
    }

    const promise = Promise.resolve();

    function ComponentThatSuspendsOnUpdate({shouldSuspend}) {
      if (shouldSuspend) {
        // Fake Suspend
        throw promise;
      }
      return null;
    }

    act(() => {
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
    });

    act(() => {
      scheduleSuspendingUpdate();
    });
  });

  it('does not destroy ref cleanup twice when hidden child is removed', async () => {
    function ChildA({label}) {
      return (
        <span
          ref={node => {
            if (node) {
              Scheduler.unstable_yieldValue('Ref mount: ' + label);
            } else {
              Scheduler.unstable_yieldValue('Ref unmount: ' + label);
            }
          }}>
          <Text text={label} />
        </span>
      );
    }

    function ChildB({label}) {
      return (
        <span
          ref={node => {
            if (node) {
              Scheduler.unstable_yieldValue('Ref mount: ' + label);
            } else {
              Scheduler.unstable_yieldValue('Ref unmount: ' + label);
            }
          }}>
          <Text text={label} />
        </span>
      );
    }

    const LazyChildA = React.lazy(() => fakeImport(ChildA));
    const LazyChildB = React.lazy(() => fakeImport(ChildB));

    function Parent({swap}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          {swap ? <LazyChildB label="B" /> : <LazyChildA label="A" />}
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Parent swap={false} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...']);

    await LazyChildA;
    expect(Scheduler).toFlushAndYield(['A', 'Ref mount: A']);
    expect(container.innerHTML).toBe('<span>A</span>');

    // Swap the position of A and B
    ReactDOM.flushSync(() => {
      root.render(<Parent swap={true} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...', 'Ref unmount: A']);
    expect(container.innerHTML).toBe(
      '<span style="display: none;">A</span>Loading...',
    );

    await LazyChildB;
    expect(Scheduler).toFlushAndYield(['B', 'Ref mount: B']);
    expect(container.innerHTML).toBe('<span>B</span>');
  });

  it('does not call componentWillUnmount twice when hidden child is removed', async () => {
    class ChildA extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('Did mount: ' + this.props.label);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Will unmount: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    class ChildB extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('Did mount: ' + this.props.label);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Will unmount: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const LazyChildA = React.lazy(() => fakeImport(ChildA));
    const LazyChildB = React.lazy(() => fakeImport(ChildB));

    function Parent({swap}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          {swap ? <LazyChildB label="B" /> : <LazyChildA label="A" />}
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Parent swap={false} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...']);

    await LazyChildA;
    expect(Scheduler).toFlushAndYield(['A', 'Did mount: A']);
    expect(container.innerHTML).toBe('A');

    // Swap the position of A and B
    ReactDOM.flushSync(() => {
      root.render(<Parent swap={true} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...', 'Will unmount: A']);
    expect(container.innerHTML).toBe('Loading...');

    await LazyChildB;
    expect(Scheduler).toFlushAndYield(['B', 'Did mount: B']);
    expect(container.innerHTML).toBe('B');
  });

  it('does not destroy layout effects twice when parent suspense is removed', async () => {
    function ChildA({label}) {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Did mount: ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Will unmount: ' + label);
        };
      }, []);
      return <Text text={label} />;
    }
    function ChildB({label}) {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Did mount: ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Will unmount: ' + label);
        };
      }, []);
      return <Text text={label} />;
    }
    const LazyChildA = React.lazy(() => fakeImport(ChildA));
    const LazyChildB = React.lazy(() => fakeImport(ChildB));

    function Parent({swap}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          {swap ? <LazyChildB label="B" /> : <LazyChildA label="A" />}
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Parent swap={false} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...']);

    await LazyChildA;
    expect(Scheduler).toFlushAndYield(['A', 'Did mount: A']);
    expect(container.innerHTML).toBe('A');

    // Swap the position of A and B
    ReactDOM.flushSync(() => {
      root.render(<Parent swap={true} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...', 'Will unmount: A']);
    expect(container.innerHTML).toBe('Loading...');

    // Destroy the whole tree, including the hidden A
    ReactDOM.flushSync(() => {
      root.render(<h1>Hello</h1>);
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(container.innerHTML).toBe('<h1>Hello</h1>');
  });

  it('does not destroy ref cleanup twice when parent suspense is removed', async () => {
    function ChildA({label}) {
      return (
        <span
          ref={node => {
            if (node) {
              Scheduler.unstable_yieldValue('Ref mount: ' + label);
            } else {
              Scheduler.unstable_yieldValue('Ref unmount: ' + label);
            }
          }}>
          <Text text={label} />
        </span>
      );
    }

    function ChildB({label}) {
      return (
        <span
          ref={node => {
            if (node) {
              Scheduler.unstable_yieldValue('Ref mount: ' + label);
            } else {
              Scheduler.unstable_yieldValue('Ref unmount: ' + label);
            }
          }}>
          <Text text={label} />
        </span>
      );
    }

    const LazyChildA = React.lazy(() => fakeImport(ChildA));
    const LazyChildB = React.lazy(() => fakeImport(ChildB));

    function Parent({swap}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          {swap ? <LazyChildB label="B" /> : <LazyChildA label="A" />}
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Parent swap={false} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...']);

    await LazyChildA;
    expect(Scheduler).toFlushAndYield(['A', 'Ref mount: A']);
    expect(container.innerHTML).toBe('<span>A</span>');

    // Swap the position of A and B
    ReactDOM.flushSync(() => {
      root.render(<Parent swap={true} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...', 'Ref unmount: A']);
    expect(container.innerHTML).toBe(
      '<span style="display: none;">A</span>Loading...',
    );

    // Destroy the whole tree, including the hidden A
    ReactDOM.flushSync(() => {
      root.render(<h1>Hello</h1>);
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(container.innerHTML).toBe('<h1>Hello</h1>');
  });

  it('does not call componentWillUnmount twice when parent suspense is removed', async () => {
    class ChildA extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('Did mount: ' + this.props.label);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Will unmount: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    class ChildB extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('Did mount: ' + this.props.label);
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('Will unmount: ' + this.props.label);
      }
      render() {
        return <Text text={this.props.label} />;
      }
    }

    const LazyChildA = React.lazy(() => fakeImport(ChildA));
    const LazyChildB = React.lazy(() => fakeImport(ChildB));

    function Parent({swap}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          {swap ? <LazyChildB label="B" /> : <LazyChildA label="A" />}
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    act(() => {
      root.render(<Parent swap={false} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...']);

    await LazyChildA;
    expect(Scheduler).toFlushAndYield(['A', 'Did mount: A']);
    expect(container.innerHTML).toBe('A');

    // Swap the position of A and B
    ReactDOM.flushSync(() => {
      root.render(<Parent swap={true} />);
    });
    expect(Scheduler).toHaveYielded(['Loading...', 'Will unmount: A']);
    expect(container.innerHTML).toBe('Loading...');

    // Destroy the whole tree, including the hidden A
    ReactDOM.flushSync(() => {
      root.render(<h1>Hello</h1>);
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(container.innerHTML).toBe('<h1>Hello</h1>');
  });

  it('regression: unmount hidden tree, in legacy mode', async () => {
    // In legacy mode, when a tree suspends and switches to a fallback, the
    // effects are not unmounted. So we have to unmount them during a deletion.

    function Child() {
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount');
        return () => {
          Scheduler.unstable_yieldValue('Unmount');
        };
      }, []);
      return <Text text="Child" />;
    }

    function Sibling() {
      return <Text text="Sibling" />;
    }
    const LazySibling = React.lazy(() => fakeImport(Sibling));

    function App({showMore}) {
      return (
        <React.Suspense fallback={<Text text="Loading..." />}>
          <Child />
          {showMore ? <LazySibling /> : null}
        </React.Suspense>
      );
    }

    // Initial render
    ReactDOM.render(<App showMore={false} />, container);
    expect(Scheduler).toHaveYielded(['Child', 'Mount']);

    // Update that suspends, causing the existing tree to switches it to
    // a fallback.
    ReactDOM.render(<App showMore={true} />, container);
    expect(Scheduler).toHaveYielded([
      'Child',
      'Loading...',

      // In a concurrent root, the effect would unmount here. But this is legacy
      // mode, so it doesn't.
      // Unmount
    ]);

    // Delete the tree and unmount the effect
    ReactDOM.render(null, container);
    expect(Scheduler).toHaveYielded(['Unmount']);
  });
});
