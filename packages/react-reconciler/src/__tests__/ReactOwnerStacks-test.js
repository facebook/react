/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
let ReactNoopServer;
let Scheduler;
let act;
let assertLog;
let serverAct;
let waitFor;

describe('ReactOwnerStacks', () => {
  beforeEach(function () {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopServer = require('react-noop-renderer/server');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    serverAct = require('internal-test-utils').serverAct;
    waitFor = require('internal-test-utils').waitFor;
  });

  function normalizeCodeLocInfo(str) {
    return (
      str &&
      str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
        return '\n    in ' + name + ' (at **)';
      })
    );
  }

  it('behavior in production', () => {
    if (!__DEV__) {
      if (gate('fb')) {
        expect(React).toHaveProperty('captureOwnerStack', undefined);
      } else {
        expect(React).not.toHaveProperty('captureOwnerStack');
      }
    }
  });

  // @gate __DEV__
  it('can get the component owner stacks during rendering in dev', async () => {
    let stack;

    function Foo() {
      return <Bar />;
    }
    function Bar() {
      return (
        <div>
          <Baz />
        </div>
      );
    }
    function Baz() {
      stack = React.captureOwnerStack();
      return <span>hi</span>;
    }

    await act(() => {
      ReactNoop.render(
        <div>
          <Foo />
        </div>,
      );
    });

    expect(normalizeCodeLocInfo(stack)).toBe(
      '\n    in Bar (at **)' + '\n    in Foo (at **)',
    );
  });

  it('returns null outside of render', async () => {
    // Awkward to gate since some builds will have `captureOwnerStack` return null in prod
    if (__DEV__) {
      expect(React.captureOwnerStack()).toBe(null);

      await act(() => {
        ReactNoop.render(<div />);
      });

      expect(React.captureOwnerStack()).toBe(null);
    }
  });

  // @gate __DEV__
  it('cuts off at the owner stack limit', async () => {
    function App({siblingsBeforeStackOne}) {
      const children = [];
      for (
        let i = 0;
        i <
        siblingsBeforeStackOne -
          // One built-in JSX callsite for the unknown Owner Stack
          1 -
          // <App /> callsite
          1 -
          // Stop so that OwnerStackOne will be right before cutoff
          1;
        i++
      ) {
        children.push(<Component key={i} />);
      }
      children.push(<OwnerStackOne key="stackOne" />);
      children.push(<OwnerStackTwo key="stackTwo" />);

      return children;
    }

    function Component() {
      return null;
    }

    let stackOne;
    function OwnerStackOne() {
      stackOne = React.captureOwnerStack();
    }

    let stackTwo;
    function OwnerStackTwo() {
      stackTwo = React.captureOwnerStack();
    }

    await act(() => {
      ReactNoop.render(
        <App
          key="one"
          // Should be the value with of `ownerStackLimit` with `__VARIANT__` so that we see the cutoff
          siblingsBeforeStackOne={500}
        />,
      );
    });

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // We continue resetting periodically.
      pendingTimers: 1,
      stackOne: '\n    in App (at **)',
      stackTwo: __VARIANT__
        ? // captured right after cutoff
          '\n    in UnknownOwner (at **)'
        : // We never hit the limit outside __VARIANT__
          '\n    in App (at **)',
    });

    // Our internal act flushes pending timers, so this will render with owner
    // stacks intact until we hit the limit again.
    await act(() => {
      ReactNoop.render(
        <App
          // TODO: Owner Stacks should update on re-render.
          key="two"
          siblingsBeforeStackOne={499}
        />,
      );
    });

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // We continue resetting periodically.
      pendingTimers: 1,
      // rendered everything before cutoff
      stackOne: '\n    in App (at **)',
      stackTwo: '\n    in App (at **)',
    });
  });

  // @gate __DEV__
  it('Fiber: resets the owner stack limit periodically', async () => {
    function App({siblingsBeforeStackOne, timeout}) {
      const children = [];
      for (
        let i = 0;
        i <
        siblingsBeforeStackOne -
          // One built-in JSX callsite for the unknown Owner Stack
          1 -
          // <App /> callsite
          1 -
          // Stop so that OwnerStackOne will be right before cutoff
          1;
        i++
      ) {
        children.push(<Component key={i} />);
      }
      children.push(<OwnerStackOne key="stackOne" />);
      children.push(<OwnerStackDelayed key="stackTwo" timeout={timeout} />);

      return children;
    }

    function Component() {
      return null;
    }

    let stackOne;
    function OwnerStackOne() {
      Scheduler.log('render OwnerStackOne');
      stackOne = React.captureOwnerStack();
    }

    let stackTwo;
    function OwnerStackTwo() {
      Scheduler.log('render OwnerStackTwo');
      stackTwo = React.captureOwnerStack();
    }
    function OwnerStackDelayed({timeout}) {
      Scheduler.log('render OwnerStackDelayed');
      React.use(timeout);
      return <OwnerStackTwo />;
    }

    React.startTransition(() => {
      ReactNoop.render(
        <App
          key="one"
          // Should be the value with of `ownerStackLimit` with `__VARIANT__` so that we see the cutoff
          siblingsBeforeStackOne={500}
          timeout={
            new Promise(resolve =>
              setTimeout(
                resolve,
                // Must be greater or equal then the reset interval
                1000,
              ),
            )
          }
        />,
      );
    });

    await waitFor(['render OwnerStackOne', 'render OwnerStackDelayed']);

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // 1 for the timeout
      // And since we haven't committed yet, we continue to reset the Owner Stack
      // limit periodically.
      pendingTimers: 2,
      stackOne: '\n    in App (at **)',
      stackTwo: undefined,
    });

    // resolve `timeout` Promise
    jest.advanceTimersByTime(1000);

    await waitFor(['render OwnerStackDelayed', 'render OwnerStackTwo']);

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // 1 for periodically resetting the Owner Stack limit
      pendingTimers: 1,
      stackOne: '\n    in App (at **)',
      stackTwo:
        // captured after we reset the limit
        '\n    in OwnerStackDelayed (at **)' +
        (__VARIANT__
          ? // captured right after we hit the limit but before we reset it
            '\n    in UnknownOwner (at **)'
          : // We never hit the limit outside __VARIANT__
            '\n    in App (at **)'),
    });
  });

  // @gate __DEV__
  it('Fizz: resets the owner stack limit periodically', async () => {
    function App({siblingsBeforeStackOne, timeout}) {
      const children = [];
      for (
        let i = 0;
        i <
        siblingsBeforeStackOne -
          // One built-in JSX callsite for the unknown Owner Stack
          1 -
          // <App /> callsite
          1 -
          // Stop so that OwnerStackOne will be right before cutoff
          1;
        i++
      ) {
        children.push(<Component key={i} />);
      }
      children.push(<OwnerStackOne key="stackOne" />);
      children.push(<OwnerStackDelayed key="stackTwo" timeout={timeout} />);

      return children;
    }

    function Component() {
      return null;
    }

    let stackOne;
    function OwnerStackOne() {
      Scheduler.log('render OwnerStackOne');
      stackOne = React.captureOwnerStack();
    }

    let stackTwo;
    function OwnerStackTwo() {
      Scheduler.log('render OwnerStackTwo');
      stackTwo = React.captureOwnerStack();
    }
    function OwnerStackDelayed({timeout}) {
      Scheduler.log('render OwnerStackDelayed');
      React.use(timeout);
      return <OwnerStackTwo />;
    }

    ReactNoopServer.render(
      <App
        key="one"
        // Should be the value with of `ownerStackLimit` with `__VARIANT__` so that we see the cutoff
        siblingsBeforeStackOne={500}
        timeout={
          new Promise(resolve =>
            setTimeout(
              resolve,
              // Must be greater or equal then the reset interval
              1000,
            ),
          )
        }
      />,
    );

    assertLog(['render OwnerStackOne', 'render OwnerStackDelayed']);

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // 1 for the timeout
      // 1 for periodically resetting the Owner Stack limit
      pendingTimers: 2,
      stackOne: '\n    in App (at **)',
      stackTwo: undefined,
    });

    await serverAct(() => {
      jest.advanceTimersByTime(1000);
    });

    expect({
      pendingTimers: jest.getTimerCount(),
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // 1 for periodically resetting the Owner Stack limit
      pendingTimers: 1,
      stackOne: '\n    in App (at **)',
      stackTwo:
        // captured after we reset the limit
        '\n    in OwnerStackDelayed (at **)' +
        (__VARIANT__
          ? // captured right after we hit the limit but before we reset it
            '\n    in UnknownOwner (at **)'
          : // We never hit the limit outside __VARIANT__
            '\n    in App (at **)'),
    });
  });
});
