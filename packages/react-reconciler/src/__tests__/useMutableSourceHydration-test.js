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
let ReactDOMServer;
let Scheduler;
let act;
let createMutableSource;
let useMutableSource;

describe('useMutableSourceHydration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');

    act = require('react-dom/test-utils').unstable_concurrentAct;
    createMutableSource = React.unstable_createMutableSource;
    useMutableSource = React.unstable_useMutableSource;
  });

  const defaultGetSnapshot = source => source.value;
  const defaultSubscribe = (source, callback) => source.subscribe(callback);

  function createComplexSource(initialValueA, initialValueB) {
    const callbacksA = [];
    const callbacksB = [];
    let revision = 0;
    let valueA = initialValueA;
    let valueB = initialValueB;

    const subscribeHelper = (callbacks, callback) => {
      if (callbacks.indexOf(callback) < 0) {
        callbacks.push(callback);
      }
      return () => {
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
          callbacks.splice(index, 1);
        }
      };
    };

    return {
      subscribeA(callback) {
        return subscribeHelper(callbacksA, callback);
      },
      subscribeB(callback) {
        return subscribeHelper(callbacksB, callback);
      },

      get listenerCountA() {
        return callbacksA.length;
      },
      get listenerCountB() {
        return callbacksB.length;
      },

      set valueA(newValue) {
        revision++;
        valueA = newValue;
        callbacksA.forEach(callback => callback());
      },
      get valueA() {
        return valueA;
      },

      set valueB(newValue) {
        revision++;
        valueB = newValue;
        callbacksB.forEach(callback => callback());
      },
      get valueB() {
        return valueB;
      },

      get version() {
        return revision;
      },
    };
  }

  function createSource(initialValue) {
    const callbacks = [];
    let revision = 0;
    let value = initialValue;
    return {
      subscribe(callback) {
        if (callbacks.indexOf(callback) < 0) {
          callbacks.push(callback);
        }
        return () => {
          const index = callbacks.indexOf(callback);
          if (index >= 0) {
            callbacks.splice(index, 1);
          }
        };
      },
      get listenerCount() {
        return callbacks.length;
      },
      set value(newValue) {
        revision++;
        value = newValue;
        callbacks.forEach(callback => callback());
      },
      get value() {
        return value;
      },
      get version() {
        return revision;
      },
    };
  }

  function Component({getSnapshot, label, mutableSource, subscribe}) {
    const snapshot = useMutableSource(mutableSource, getSnapshot, subscribe);
    Scheduler.unstable_yieldValue(`${label}:${snapshot}`);
    return <div>{`${label}:${snapshot}`}</div>;
  }

  // @gate experimental
  it('should render and hydrate', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    expect(Scheduler).toHaveYielded(['only:one']);
    expect(source.listenerCount).toBe(0);

    const root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        mutableSources: [mutableSource],
      },
    });
    act(() => {
      root.render(<TestComponent />);
    });
    expect(Scheduler).toHaveYielded(['only:one']);
    expect(source.listenerCount).toBe(1);
  });

  // @gate experimental
  it('should detect a tear before hydrating a component', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    expect(Scheduler).toHaveYielded(['only:one']);
    expect(source.listenerCount).toBe(0);

    const root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        mutableSources: [mutableSource],
      },
    });
    expect(() => {
      act(() => {
        root.render(<TestComponent />);

        source.value = 'two';
      });
    }).toErrorDev(
      'Warning: Did not expect server HTML to contain a <div> in <div>.',
      {withoutStack: true},
    );
    expect(Scheduler).toHaveYielded(['only:two']);
    expect(source.listenerCount).toBe(1);
  });

  // @gate experimental
  it('should detect a tear between hydrating components', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <>
          <Component
            label="a"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
          <Component
            label="b"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
        </>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    expect(Scheduler).toHaveYielded(['a:one', 'b:one']);
    expect(source.listenerCount).toBe(0);

    const root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        mutableSources: [mutableSource],
      },
    });
    expect(() => {
      act(() => {
        root.render(<TestComponent />);
        expect(Scheduler).toFlushAndYieldThrough(['a:one']);
        source.value = 'two';
      });
    }).toErrorDev(
      'Warning: Did not expect server HTML to contain a <div> in <div>.',
      {withoutStack: true},
    );
    expect(Scheduler).toHaveYielded(['a:two', 'b:two']);
    expect(source.listenerCount).toBe(2);
  });

  // @gate experimental
  it('should detect a tear between hydrating components reading from different parts of a source', () => {
    const source = createComplexSource('a:one', 'b:one');
    const mutableSource = createMutableSource(source, param => param.version);

    // Subscribe to part of the store.
    const getSnapshotA = s => s.valueA;
    const subscribeA = (s, callback) => s.subscribeA(callback);
    const getSnapshotB = s => s.valueB;
    const subscribeB = (s, callback) => s.subscribeB(callback);

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(
      <>
        <Component
          label="0"
          getSnapshot={getSnapshotA}
          mutableSource={mutableSource}
          subscribe={subscribeA}
        />
        <Component
          label="1"
          getSnapshot={getSnapshotB}
          mutableSource={mutableSource}
          subscribe={subscribeB}
        />
      </>,
    );
    container.innerHTML = htmlString;
    expect(Scheduler).toHaveYielded(['0:a:one', '1:b:one']);

    const root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        mutableSources: [mutableSource],
      },
    });
    expect(() => {
      act(() => {
        root.render(
          <>
            <Component
              label="0"
              getSnapshot={getSnapshotA}
              mutableSource={mutableSource}
              subscribe={subscribeA}
            />
            <Component
              label="1"
              getSnapshot={getSnapshotB}
              mutableSource={mutableSource}
              subscribe={subscribeB}
            />
          </>,
        );
        expect(Scheduler).toFlushAndYieldThrough(['0:a:one']);
        source.valueB = 'b:two';
      });
    }).toErrorDev(
      'Warning: Did not expect server HTML to contain a <div> in <div>.',
      {withoutStack: true},
    );
    expect(Scheduler).toHaveYielded(['0:a:one', '1:b:two']);
  });

  // @gate experimental
  it('should detect a tear during a higher priority interruption', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function Unrelated({flag}) {
      Scheduler.unstable_yieldValue(flag);
      return flag;
    }

    function TestComponent({flag}) {
      return (
        <>
          <Unrelated flag={flag} />
          <Component
            label="a"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
        </>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(
      <TestComponent flag={1} />,
    );
    container.innerHTML = htmlString;
    expect(Scheduler).toHaveYielded([1, 'a:one']);
    expect(source.listenerCount).toBe(0);

    const root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        mutableSources: [mutableSource],
      },
    });
    expect(() => {
      act(() => {
        root.render(<TestComponent flag={1} />);
        expect(Scheduler).toFlushAndYieldThrough([1]);

        // Render an update which will be higher priority than the hydration.
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => root.render(<TestComponent flag={2} />),
        );
        expect(Scheduler).toFlushAndYieldThrough([2]);

        source.value = 'two';
      });
    }).toErrorDev(
      'Warning: Text content did not match. Server: "1" Client: "2"',
    );
    expect(Scheduler).toHaveYielded([2, 'a:two']);
    expect(source.listenerCount).toBe(1);
  });
});
