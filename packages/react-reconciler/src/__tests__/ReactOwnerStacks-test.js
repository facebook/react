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
let act;

describe('ReactOwnerStacks', () => {
  beforeEach(function () {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    act = require('internal-test-utils').act;
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
          // Number of JSX callsites before this render
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
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      stackOne: '\n    in App (at **)',
      stackTwo: __VARIANT__
        ? // captured right after cutoff
          '\n    in UnknownOwner (at **)'
        : '\n    in App (at **)',
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
      stackOne: normalizeCodeLocInfo(stackOne),
      stackTwo: normalizeCodeLocInfo(stackTwo),
    }).toEqual({
      // rendered everything before cutoff
      stackOne: '\n    in App (at **)',
      stackTwo: '\n    in App (at **)',
    });
  });
});
