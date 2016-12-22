/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactFiberInstrumentation;
var ReactNoop;

describe('ReactFiberInstrumentation', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactFiberInstrumentation = require('ReactFiberInstrumentation');
    ReactNoop = require('ReactNoop');
  });

  afterEach(() => {
    ReactFiberInstrumentation.debugTool = null;
  });

  it('should report unhandled errors', () => {
    const calls = [];
    ReactFiberInstrumentation.debugTool = {
      onMountContainer() {},
      onUpdateContainer() {},
      onWillBeginWork() {},
      onDidBeginWork() {},
      onWillCompleteWork() {},
      onDidCompleteWork() {},
      onUncaughtError(err, stack) {
        calls.push([err, stack]);
      },
    };

    function Bar() {
      throw new Error('Hello');
    }

    function Foo() {
      return (
        <h1>
          <Bar isBar={true} />
        </h1>
      );
    }

    ReactNoop.render(<Foo />);
    expect(() => {
      ReactNoop.flush();
    }).toThrowError('Hello');
    expect(calls.length).toBe(1);
    let [err, stack] = calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Hello');
    expect(normalizeCodeLocInfo(stack)).toBe(
      '    in Bar (at **)\n' +
      '    in h1 (at **)\n' +
      '    in Foo (at **)'
    );

    // Make sure recorded errors get cleared.
    calls.length = 0;
    ReactNoop.render(<h1>No errors</h1>);
    ReactNoop.flush();
    expect(calls.length).toBe(0);

    // Make sure it works when no stack is available.
    calls.length = 0;
    ReactNoop.render(React.createElement(Bar));
    expect(() => {
      ReactNoop.flush();
    }).toThrowError('Hello');
    expect(calls.length).toBe(1);
    ([err, stack] = calls[0]);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Hello');
    expect(normalizeCodeLocInfo(stack)).toBe(
      '    in Bar'
    );
  });
});
