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

  // @gate __DEV__ && enableOwnerStacks
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
    if (__DEV__ && gate('enableOwnerStacks')) {
      expect(React.captureOwnerStack()).toBe(null);

      await act(() => {
        ReactNoop.render(<div />);
      });

      expect(React.captureOwnerStack()).toBe(null);
    }
  });
});
