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

const React = require('react');
const stripAnsi = require('strip-ansi');
const {startTransition, useDeferredValue} = React;
const chalk = require('chalk');
const ReactNoop = require('react-noop-renderer');
const {
  waitFor,
  waitForAll,
  waitForPaint,
  waitForThrow,
  assertLog,
} = require('internal-test-utils');
const act = require('internal-test-utils').act;
const Scheduler = require('scheduler/unstable_mock');
const {
  flushAllUnexpectedConsoleCalls,
  resetAllUnexpectedConsoleCalls,
  patchConsoleMethods,
} = require('../consoleMock');
const {
  assertConsoleLogDev,
  assertConsoleWarnDev,
  assertConsoleErrorDev,
} = require('../ReactInternalTestUtils');

describe('ReactInternalTestUtils', () => {
  it('waitFor', async () => {
    const Yield = ({id}) => {
      Scheduler.log(id);
      return id;
    };

    const root = ReactNoop.createRoot();
    startTransition(() => {
      root.render(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>
      );
    });

    await waitFor(['foo', 'bar']);
    expect(root).toMatchRenderedOutput(null);
    await waitFor(['baz']);
    expect(root).toMatchRenderedOutput(null);
    await waitForAll([]);
    expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
  });

  it('waitForAll', async () => {
    const Yield = ({id}) => {
      Scheduler.log(id);
      return id;
    };

    const root = ReactNoop.createRoot();
    startTransition(() => {
      root.render(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>
      );
    });

    await waitForAll(['foo', 'bar', 'baz']);
    expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
  });

  it('waitForThrow', async () => {
    const Yield = ({id}) => {
      Scheduler.log(id);
      return id;
    };

    function BadRender() {
      throw new Error('Oh no!');
    }

    function App() {
      return (
        <div>
          <Yield id="A" />
          <Yield id="B" />
          <BadRender />
          <Yield id="C" />
          <Yield id="D" />
        </div>
      );
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);

    await waitForThrow('Oh no!');
    assertLog([
      'A',
      'B',
      // React will try one more time before giving up.
      'A',
      'B',
    ]);
  });

  it('waitForPaint', async () => {
    function App({prop}) {
      const deferred = useDeferredValue(prop);
      const text = `Urgent: ${prop}, Deferred: ${deferred}`;
      Scheduler.log(text);
      return text;
    }

    const root = ReactNoop.createRoot();
    root.render(<App prop="A" />);

    await waitForAll(['Urgent: A, Deferred: A']);
    expect(root).toMatchRenderedOutput('Urgent: A, Deferred: A');

    // This update will result in two separate paints: an urgent one, and a
    // deferred one.
    root.render(<App prop="B" />);
    // Urgent paint
    await waitForPaint(['Urgent: B, Deferred: A']);
    expect(root).toMatchRenderedOutput('Urgent: B, Deferred: A');

    // Deferred paint
    await waitForPaint(['Urgent: B, Deferred: B']);
    expect(root).toMatchRenderedOutput('Urgent: B, Deferred: B');
  });

  it('assertLog', async () => {
    const Yield = ({id}) => {
      Scheduler.log(id);
      React.useEffect(() => {
        Scheduler.log(`create effect ${id}`);
        return () => {
          Scheduler.log(`cleanup effect ${id}`);
        };
      });
      return id;
    };

    function App() {
      return (
        <div>
          <Yield id="A" />
          <Yield id="B" />
          <Yield id="C" />
        </div>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    });
    assertLog([
      'A',
      'B',
      'C',
      'create effect A',
      'create effect B',
      'create effect C',
    ]);

    await act(() => {
      root.render(null);
    });

    assertLog(['cleanup effect A', 'cleanup effect B', 'cleanup effect C']);
  });
});

describe('ReactInternalTestUtils console mocks', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    patchConsoleMethods({includeLog: true});
  });

  afterEach(() => {
    resetAllUnexpectedConsoleCalls();
    jest.resetAllMocks();
  });

  describe('console.log', () => {
    it('should fail if not asserted', () => {
      expect(() => {
        console.log('hit');
        flushAllUnexpectedConsoleCalls();
      }).toThrow(`Expected test not to call ${chalk.bold('console.log()')}.`);
    });

    // @gate __DEV__
    it('should not fail if mocked with spyOnDev', () => {
      spyOnDev(console, 'log').mockImplementation(() => {});
      expect(() => {
        console.log('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate !__DEV__
    it('should not fail if mocked with spyOnProd', () => {
      spyOnProd(console, 'log').mockImplementation(() => {});
      expect(() => {
        console.log('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    it('should not fail if mocked with spyOnDevAndProd', () => {
      spyOnDevAndProd(console, 'log').mockImplementation(() => {});
      expect(() => {
        console.log('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate __DEV__
    it('should not fail with toLogDev', () => {
      expect(() => {
        console.log('hit');
        flushAllUnexpectedConsoleCalls();
      }).toLogDev(['hit']);
    });
  });

  describe('console.warn', () => {
    it('should fail if not asserted', () => {
      expect(() => {
        console.warn('hit');
        flushAllUnexpectedConsoleCalls();
      }).toThrow(`Expected test not to call ${chalk.bold('console.warn()')}.`);
    });

    // @gate __DEV__
    it('should not fail if mocked with spyOnDev', () => {
      spyOnDev(console, 'warn').mockImplementation(() => {});
      expect(() => {
        console.warn('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate !__DEV__
    it('should not fail if mocked with spyOnProd', () => {
      spyOnProd(console, 'warn').mockImplementation(() => {});
      expect(() => {
        console.warn('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    it('should not fail if mocked with spyOnDevAndProd', () => {
      spyOnDevAndProd(console, 'warn').mockImplementation(() => {});
      expect(() => {
        console.warn('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate __DEV__
    it('should not fail with toWarnDev', () => {
      expect(() => {
        console.warn('hit');
        flushAllUnexpectedConsoleCalls();
      }).toWarnDev(['hit'], {withoutStack: true});
    });
  });

  describe('console.error', () => {
    it('should fail if console.error is not asserted', () => {
      expect(() => {
        console.error('hit');
        flushAllUnexpectedConsoleCalls();
      }).toThrow(`Expected test not to call ${chalk.bold('console.error()')}.`);
    });

    // @gate __DEV__
    it('should not fail if mocked with spyOnDev', () => {
      spyOnDev(console, 'error').mockImplementation(() => {});
      expect(() => {
        console.error('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate !__DEV__
    it('should not fail if mocked with spyOnProd', () => {
      spyOnProd(console, 'error').mockImplementation(() => {});
      expect(() => {
        console.error('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    it('should not fail if mocked with spyOnDevAndProd', () => {
      spyOnDevAndProd(console, 'error').mockImplementation(() => {});
      expect(() => {
        console.error('hit');
        flushAllUnexpectedConsoleCalls();
      }).not.toThrow();
    });

    // @gate __DEV__
    it('should not fail with toErrorDev', () => {
      expect(() => {
        console.error('hit');
        flushAllUnexpectedConsoleCalls();
      }).toErrorDev(['hit'], {withoutStack: true});
    });
  });
});

// Helper method to capture assertion failure.
const expectToThrowFailure = expectBlock => {
  let caughtError;
  try {
    expectBlock();
  } catch (error) {
    caughtError = error;
  }
  expect(caughtError).toBeDefined();
  return stripAnsi(caughtError.message);
};

// Helper method to capture assertion failure with act.
const awaitExpectToThrowFailure = async expectBlock => {
  let caughtError;
  try {
    await expectBlock();
  } catch (error) {
    caughtError = error;
  }
  expect(caughtError).toBeDefined();
  return stripAnsi(caughtError.message);
};

describe('ReactInternalTestUtils console assertions', () => {
  beforeAll(() => {
    patchConsoleMethods({includeLog: true});
  });

  describe('assertConsoleLogDev', () => {
    // @gate __DEV__
    it('passes for a single log', () => {
      console.log('Hello');
      assertConsoleLogDev(['Hello']);
    });

    // @gate __DEV__
    it('passes for multiple logs', () => {
      console.log('Hello');
      console.log('Good day');
      console.log('Bye');
      assertConsoleLogDev(['Hello', 'Good day', 'Bye']);
    });

    it('fails if act is called without assertConsoleLogDev', async () => {
      const Yield = ({id}) => {
        console.log(id);
        return id;
      };

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <Yield id="C" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      await act(() => {
        root.render(<App />);
      });
      const message = await awaitExpectToThrowFailure(async () => {
        await act(() => {
          root.render(<App />);
        });
      });

      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.log was called without assertConsoleLogDev:
        + A
        + B
        + C

        You must call one of the assertConsoleDev helpers between each act call."
      `);
    });

    // @gate __DEV__
    it('fails if first expected log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Wow');
        console.log('Bye');
        assertConsoleLogDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

        - Hi
          Wow
          Bye"
      `);
    });

    // @gate __DEV__
    it('fails if middle expected log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Bye');
        assertConsoleLogDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

          Hi
        - Wow
          Bye"
      `);
    });

    // @gate __DEV__
    it('fails if last expected log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Wow');
        assertConsoleLogDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Expected log was not recorded.

        - Expected logs
        + Received logs

          Hi
          Wow
        - Bye"
      `);
    });

    // @gate __DEV__
    it('fails if first received log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Wow');
        console.log('Bye');
        assertConsoleLogDev(['Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

        + Hi
          Wow
          Bye"
      `);
    });

    // @gate __DEV__
    it('fails if middle received log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Wow');
        console.log('Bye');
        assertConsoleLogDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

          Hi
        + Wow
          Bye"
      `);
    });

    // @gate __DEV__
    it('fails if last received log is not included', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Wow');
        console.log('Bye');
        assertConsoleLogDev(['Hi', 'Wow']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

          Hi
          Wow
        + Bye"
      `);
    });

    // @gate __DEV__
    it('fails if both expected and received mismatch', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Wow');
        console.log('Bye');
        assertConsoleLogDev(['Hi', 'Wow', 'Yikes']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

          Hi
          Wow
        - Yikes
        + Bye"
      `);
    });

    // @gate __DEV__
    it('fails if both expected and received mismatch with multiple lines', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi\nFoo');
        console.log('Wow\nBar');
        console.log('Bye\nBaz');
        assertConsoleLogDev(['Hi\nFoo', 'Wow\nBar', 'Yikes\nFaz']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Unexpected log(s) recorded.

        - Expected logs
        + Received logs

          Hi Foo
          Wow Bar
        - Yikes Faz
        + Bye Baz"
      `);
    });

    // @gate __DEV__
    it('fails if local withoutStack passed to assertConsoleLogDev', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hello');
        assertConsoleLogDev([['Hello', {withoutStack: true}]]);
      });

      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Do not pass withoutStack to assertConsoleLogDev logs, console.log does not have component stacks."
      `);
    });

    // @gate __DEV__
    it('fails if global withoutStack passed to assertConsoleLogDev', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hello');
        assertConsoleLogDev(['Hello'], {withoutStack: true});
      });

      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Do not pass withoutStack to assertConsoleLogDev, console.log does not have component stacks."
      `);

      assertConsoleLogDev(['Hello']);
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi %s', 'Sara', 'extra');
        assertConsoleLogDev(['Hi']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number for multiple logs', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi %s', 'Sara', 'extra');
        console.log('Bye %s', 'Sara', 'extra');
        assertConsoleLogDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 2 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi %s');
        assertConsoleLogDev(['Hi']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args for multiple logs', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi %s');
        console.log('Bye %s');
        assertConsoleLogDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 0 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if first arg is not an array', () => {
      const message = expectToThrowFailure(() => {
        console.log('Hi');
        console.log('Bye');
        assertConsoleLogDev('Hi', 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleLogDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);

      assertConsoleLogDev(['Hi', 'Bye']);
    });

    it('should fail if waitFor is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.log('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitFor(['foo', 'bar']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.log was called without assertConsoleLogDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });

    it('should fail if waitForThrow is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      function BadRender() {
        throw new Error('Oh no!');
      }

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <BadRender />
            <Yield id="C" />
            <Yield id="D" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      root.render(<App />);

      console.log('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForThrow('Oh no!');
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.log was called without assertConsoleLogDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['A', 'B', 'A', 'B']);
    });

    it('should fail if waitForPaint is called before asserting', async () => {
      function App({prop}) {
        const deferred = useDeferredValue(prop);
        const text = `Urgent: ${prop}, Deferred: ${deferred}`;
        Scheduler.log(text);
        return text;
      }

      const root = ReactNoop.createRoot();
      root.render(<App prop="A" />);

      await waitForAll(['Urgent: A, Deferred: A']);
      expect(root).toMatchRenderedOutput('Urgent: A, Deferred: A');

      // This update will result in two separate paints: an urgent one, and a
      // deferred one.
      root.render(<App prop="B" />);

      console.log('Not asserted');
      const message = await awaitExpectToThrowFailure(async () => {
        await waitForPaint(['Urgent: B, Deferred: A']);
      });

      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.log was called without assertConsoleLogDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['Urgent: B, Deferred: A', 'Urgent: B, Deferred: B']);
    });

    it('should fail if waitForAll is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.log('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForAll(['foo', 'bar', 'baz']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.log was called without assertConsoleLogDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });
    it('should fail if toMatchRenderedOutput is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        console.log('Not asserted');
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      assertLog([]);

      await waitForAll(['foo', 'bar', 'baz']);
      const message = expectToThrowFailure(() => {
        expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
      });
      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + Not asserted
          + Not asserted
          + Not asserted

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + Not asserted
          + Not asserted
          + Not asserted

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + Not asserted
          + Not asserted
          + Not asserted

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }

      expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
    });
  });

  describe('assertConsoleWarnDev', () => {
    // @gate __DEV__
    it('passes if an warning contains a stack', () => {
      console.warn('Hello\n    in div');
      assertConsoleWarnDev(['Hello']);
    });

    // @gate __DEV__
    it('passes if all warnings contain a stack', () => {
      console.warn('Hello\n    in div');
      console.warn('Good day\n    in div');
      console.warn('Bye\n    in div');
      assertConsoleWarnDev(['Hello', 'Good day', 'Bye']);
    });

    it('fails if act is called without assertConsoleWarnDev', async () => {
      const Yield = ({id}) => {
        console.warn(id);
        return id;
      };

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <Yield id="C" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      await act(() => {
        root.render(<App />);
      });
      const message = await awaitExpectToThrowFailure(async () => {
        await act(() => {
          root.render(<App />);
        });
      });

      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + A
          + B
          + C

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + A%s,
          +     in App (at **)
          + B%s,
          +     in App (at **)
          + C%s,
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }
    });

    it('fails if act is called without any assertConsoleDev helpers', async () => {
      const Yield = ({id}) => {
        console.log(id);
        console.warn(id);
        console.error(id);
        return id;
      };

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <Yield id="C" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      await act(() => {
        root.render(<App />);
      });
      const message = await awaitExpectToThrowFailure(async () => {
        await act(() => {
          root.render(<App />);
        });
      });

      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + A
          + B
          + C

          console.warn was called without assertConsoleWarnDev:
          + A
          + B
          + C

          console.error was called without assertConsoleErrorDev:
          + A
          + B
          + C

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + A
          + B
          + C

          console.warn was called without assertConsoleWarnDev:
          + A%s,
          +     in App (at **)
          + B%s,
          +     in App (at **)
          + C%s,
          +     in App (at **)

          console.error was called without assertConsoleErrorDev:
          + A%s,
          +     in App (at **)
          + B%s,
          +     in App (at **)
          + C%s,
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + A
          + B
          + C

          console.warn was called without assertConsoleWarnDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          console.error was called without assertConsoleErrorDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }
    });

    // @gate __DEV__
    it('fails if first expected warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Wow \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Unexpected warning(s) recorded.

        - Expected warnings
        + Received warnings

        - Hi
        - Wow
        - Bye
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if middle expected warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Unexpected warning(s) recorded.

        - Expected warnings
        + Received warnings

        - Hi
        - Wow
        - Bye
        + Hi      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if last expected warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Wow \n    in div');
        assertConsoleWarnDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Expected warning was not recorded.

        - Expected warnings
        + Received warnings

        - Hi
        - Wow
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if first received warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Wow \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev(['Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Unexpected warning(s) recorded.

        - Expected warnings
        + Received warnings

        - Wow
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if middle received warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Wow \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Unexpected warning(s) recorded.

        - Expected warnings
        + Received warnings

        - Hi
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if last received warning is not included', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Wow \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev(['Hi', 'Wow']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Unexpected warning(s) recorded.

        - Expected warnings
        + Received warnings

        - Hi
        - Wow
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if only warning does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hello');
        assertConsoleWarnDev(['Hello']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Missing component stack for:
          "Hello"

        If this warning should omit a component stack, pass [log, {withoutStack: true}].
        If all warnings should omit the component stack, add {withoutStack: true} to the assertConsoleWarnDev call."
      `);
    });

    // @gate __DEV__
    it('fails if first warning does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hello');
        console.warn('Good day\n    in div');
        console.warn('Bye\n    in div');
        assertConsoleWarnDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Missing component stack for:
          "Hello"

        If this warning should omit a component stack, pass [log, {withoutStack: true}].
        If all warnings should omit the component stack, add {withoutStack: true} to the assertConsoleWarnDev call."
      `);
    });

    // @gate __DEV__
    it('fails if middle warning does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hello\n    in div');
        console.warn('Good day');
        console.warn('Bye\n    in div');
        assertConsoleWarnDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Missing component stack for:
          "Good day"

        If this warning should omit a component stack, pass [log, {withoutStack: true}].
        If all warnings should omit the component stack, add {withoutStack: true} to the assertConsoleWarnDev call."
      `);
    });

    // @gate __DEV__
    it('fails if last warning does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hello\n    in div');
        console.warn('Good day\n    in div');
        console.warn('Bye');
        assertConsoleWarnDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Missing component stack for:
          "Bye"

        If this warning should omit a component stack, pass [log, {withoutStack: true}].
        If all warnings should omit the component stack, add {withoutStack: true} to the assertConsoleWarnDev call."
      `);
    });

    // @gate __DEV__
    it('fails if all warnings do not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hello');
        console.warn('Good day');
        console.warn('Bye');
        assertConsoleWarnDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Missing component stack for:
          "Hello"

        Missing component stack for:
          "Good day"

        Missing component stack for:
          "Bye"

        If this warning should omit a component stack, pass [log, {withoutStack: true}].
        If all warnings should omit the component stack, add {withoutStack: true} to the assertConsoleWarnDev call."
      `);
    });

    describe('global withoutStack', () => {
      // @gate __DEV__
      it('passes if warnings without stack explicitly opt out', () => {
        console.warn('Hello');
        assertConsoleWarnDev(['Hello'], {withoutStack: true});

        console.warn('Hello');
        console.warn('Good day');
        console.warn('Bye');

        assertConsoleWarnDev(['Hello', 'Good day', 'Bye'], {
          withoutStack: true,
        });
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid null value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev(['Hi'], {withoutStack: null});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":null}."
        `);
        assertConsoleWarnDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid {} value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev(['Hi'], {withoutStack: {}});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":{}}."
        `);
        assertConsoleWarnDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid string value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev(['Hi'], {withoutStack: 'haha'});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":"haha"}."
        `);
        assertConsoleWarnDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if only warning is not expected to have a stack, but does', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello\n    in div');
          assertConsoleWarnDev(['Hello'], {withoutStack: true});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          If this warning should include a component stack, remove {withoutStack: true} from this warning.
          If all warnings should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleWarnDev call."
        `);
      });

      // @gate __DEV__
      it('fails if warnings are not expected to have a stack, but some do', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello\n    in div');
          console.warn('Good day');
          console.warn('Bye\n    in div');
          assertConsoleWarnDev(['Hello', 'Good day', 'Bye'], {
            withoutStack: true,
          });
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          Unexpected component stack for:
            "Bye
              in div (at **)"

          If this warning should include a component stack, remove {withoutStack: true} from this warning.
          If all warnings should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleWarnDev call."
        `);
      });
    });
    describe('local withoutStack', () => {
      // @gate __DEV__
      it('passes when expected withoutStack logs matches the actual logs', () => {
        console.warn('Hello\n    in div');
        console.warn('Good day');
        console.warn('Bye\n    in div');
        assertConsoleWarnDev([
          'Hello',
          ['Good day', {withoutStack: true}],
          'Bye',
        ]);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid null value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev([['Hi', {withoutStack: null}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":null}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid {} value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev([['Hi', {withoutStack: {}}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":{}}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid string value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev([['Hi', {withoutStack: 'haha'}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":"haha"}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid number value', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hi');
          assertConsoleWarnDev([['Hi', {withoutStack: 4}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":4}]."
        `);
      });

      // @gate __DEV__
      it('fails if you forget to wrap local withoutStack in array', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello\n    in div');
          console.warn('Bye\n    in div');
          assertConsoleWarnDev(['Hello', {withoutStack: true}, 'Bye']);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Did you forget to wrap a log with withoutStack in an array?

          The expected message for assertConsoleWarnDev() must be a string or an array of length 2.

          Instead received {"withoutStack":true}."
        `);
      });

      // @gate __DEV__
      it('fails if you wrap in an array unnecessarily', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello');
          assertConsoleWarnDev([['Hello']]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Did you forget to remove the array around the log?

          The expected message for assertConsoleWarnDev() must be a string or an array of length 2, but there's only one item in the array. If this is intentional, remove the extra array."
        `);
      });

      // @gate __DEV__
      it('fails if only warning is not expected to have a stack, but does', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello\n    in div');
          assertConsoleWarnDev([['Hello', {withoutStack: true}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          If this warning should include a component stack, remove {withoutStack: true} from this warning.
          If all warnings should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleWarnDev call."
        `);
      });

      // @gate __DEV__
      it('fails if warnings are not expected to have a stack, but some do', () => {
        const message = expectToThrowFailure(() => {
          console.warn('Hello\n    in div');
          console.warn('Good day');
          console.warn('Bye\n    in div');
          assertConsoleWarnDev([
            [
              'Hello',
              {
                withoutStack: true,
              },
            ],
            'Good day',
            [
              'Bye',
              {
                withoutStack: true,
              },
            ],
          ]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleWarnDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          Unexpected component stack for:
            "Bye
              in div (at **)"

          If this warning should include a component stack, remove {withoutStack: true} from this warning.
          If all warnings should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleWarnDev call."
        `);
      });
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s', 'Sara', 'extra');
        assertConsoleWarnDev(['Hi'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number for multiple warnings', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s', 'Sara', 'extra');
        console.warn('Bye %s', 'Sara', 'extra');
        assertConsoleWarnDev(['Hi', 'Bye'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 2 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s');
        assertConsoleWarnDev(['Hi'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args for multiple warnings', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s');
        console.warn('Bye %s');
        assertConsoleWarnDev(['Hi', 'Bye'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 0 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if component stack is passed twice', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s%s', '\n    in div', '\n    in div');
        assertConsoleWarnDev(['Hi']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received more than one component stack for a warning:
          "Hi %s%s""
      `);
    });

    // @gate __DEV__
    it('fails if multiple logs pass component stack twice', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi %s%s', '\n    in div', '\n    in div');
        console.warn('Bye %s%s', '\n    in div', '\n    in div');
        assertConsoleWarnDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Received more than one component stack for a warning:
          "Hi %s%s"

        Received more than one component stack for a warning:
          "Bye %s%s""
      `);
    });

    // @gate __DEV__
    it('fails if multiple strings are passed without an array wrapper for single log', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev('Hi', 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleWarnDev(['Hi', 'Bye']);
    });

    // @gate __DEV__
    it('fails if multiple strings are passed without an array wrapper for multiple logs', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev('Hi', 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleWarnDev(['Hi', 'Bye']);
    });

    // @gate __DEV__
    it('fails on more than two arguments', () => {
      const message = expectToThrowFailure(() => {
        console.warn('Hi \n    in div');
        console.warn('Wow \n    in div');
        console.warn('Bye \n    in div');
        assertConsoleWarnDev('Hi', undefined, 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleWarnDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleWarnDev(['Hi', 'Wow', 'Bye']);
    });

    it('should fail if waitFor is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.warn('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitFor(['foo', 'bar']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.warn was called without assertConsoleWarnDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });

    it('should fail if waitForThrow is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      function BadRender() {
        throw new Error('Oh no!');
      }

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <BadRender />
            <Yield id="C" />
            <Yield id="D" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      root.render(<App />);

      console.warn('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForThrow('Oh no!');
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.warn was called without assertConsoleWarnDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['A', 'B', 'A', 'B']);
    });

    it('should fail if waitForPaint is called before asserting', async () => {
      function App({prop}) {
        const deferred = useDeferredValue(prop);
        const text = `Urgent: ${prop}, Deferred: ${deferred}`;
        Scheduler.log(text);
        return text;
      }

      const root = ReactNoop.createRoot();
      root.render(<App prop="A" />);

      await waitForAll(['Urgent: A, Deferred: A']);
      expect(root).toMatchRenderedOutput('Urgent: A, Deferred: A');

      // This update will result in two separate paints: an urgent one, and a
      // deferred one.
      root.render(<App prop="B" />);

      console.warn('Not asserted');
      const message = await awaitExpectToThrowFailure(async () => {
        await waitForPaint(['Urgent: B, Deferred: A']);
      });

      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.warn was called without assertConsoleWarnDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['Urgent: B, Deferred: A', 'Urgent: B, Deferred: B']);
    });

    it('should fail if waitForAll is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.warn('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForAll(['foo', 'bar', 'baz']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.warn was called without assertConsoleWarnDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });
    it('should fail if toMatchRenderedOutput is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        console.warn('Not asserted');
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      assertLog([]);

      await waitForAll(['foo', 'bar', 'baz']);
      const message = expectToThrowFailure(() => {
        expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
      });
      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + Not asserted
          + Not asserted
          + Not asserted

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + Not asserted%s,
          +     in Yield (at **)
          + Not asserted%s,
          +     in Yield (at **)
          + Not asserted%s,
          +     in Yield (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.warn was called without assertConsoleWarnDev:
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }

      expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
    });
  });

  describe('assertConsoleErrorDev', () => {
    // @gate __DEV__
    it('passes if an error contains a stack', () => {
      console.error('Hello\n    in div');
      assertConsoleErrorDev(['Hello']);
    });

    // @gate __DEV__
    it('passes if all errors contain a stack', () => {
      console.error('Hello\n    in div');
      console.error('Good day\n    in div');
      console.error('Bye\n    in div');
      assertConsoleErrorDev(['Hello', 'Good day', 'Bye']);
    });

    it('fails if act is called without assertConsoleErrorDev', async () => {
      const Yield = ({id}) => {
        console.error(id);
        return id;
      };

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <Yield id="C" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      await act(() => {
        root.render(<App />);
      });
      const message = await awaitExpectToThrowFailure(async () => {
        await act(() => {
          root.render(<App />);
        });
      });

      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.error was called without assertConsoleErrorDev:
          + A
          + B
          + C

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
                  "asserConsoleLogsCleared(expected)

                  console.error was called without assertConsoleErrorDev:
                  + A%s,
                  +     in App (at **)
                  + B%s,
                  +     in App (at **)
                  + C%s,
                  +     in App (at **)

                  You must call one of the assertConsoleDev helpers between each act call."
              `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.error was called without assertConsoleErrorDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }
    });

    it('fails if act is called without any assertConsoleDev helpers', async () => {
      const Yield = ({id}) => {
        console.log(id);
        console.warn(id);
        console.error(id);
        return id;
      };

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <Yield id="C" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      await act(() => {
        root.render(<App />);
      });
      const message = await awaitExpectToThrowFailure(async () => {
        await act(() => {
          root.render(<App />);
        });
      });

      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + A
          + B
          + C

          console.warn was called without assertConsoleWarnDev:
          + A
          + B
          + C

          console.error was called without assertConsoleErrorDev:
          + A
          + B
          + C

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
                  "asserConsoleLogsCleared(expected)

                  console.log was called without assertConsoleLogDev:
                  + A
                  + B
                  + C

                  console.warn was called without assertConsoleWarnDev:
                  + A%s,
                  +     in App (at **)
                  + B%s,
                  +     in App (at **)
                  + C%s,
                  +     in App (at **)

                  console.error was called without assertConsoleErrorDev:
                  + A%s,
                  +     in App (at **)
                  + B%s,
                  +     in App (at **)
                  + C%s,
                  +     in App (at **)

                  You must call one of the assertConsoleDev helpers between each act call."
              `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.log was called without assertConsoleLogDev:
          + A
          + B
          + C

          console.warn was called without assertConsoleWarnDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          console.error was called without assertConsoleErrorDev:
          + A%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + B%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)
          + C%s,
          +     in Yield (at **)
          +     in div (at **)
          +     in App (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }
    });

    // @gate __DEV__
    it('fails if first expected error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Wow \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - Hi
        - Wow
        - Bye
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if middle expected error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - Hi
        - Wow
        - Bye
        + Hi      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if last expected error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Wow \n    in div');
        assertConsoleErrorDev(['Hi', 'Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Expected error was not recorded.

        - Expected errors
        + Received errors

        - Hi
        - Wow
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if first received error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Wow \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev(['Wow', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - Wow
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if middle received error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Wow \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - Hi
        - Bye
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });

    // @gate __DEV__
    it('fails if last received error is not included', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Wow \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev(['Hi', 'Wow']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - Hi
        - Wow
        + Hi      in div (at **)
        + Wow      in div (at **)
        + Bye      in div (at **)"
      `);
    });
    // @gate __DEV__
    it('fails if only error does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hello');
        assertConsoleErrorDev(['Hello']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Missing component stack for:
          "Hello"

        If this error should omit a component stack, pass [log, {withoutStack: true}].
        If all errors should omit the component stack, add {withoutStack: true} to the assertConsoleErrorDev call."
      `);
    });

    // @gate __DEV__
    it('fails if first error does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hello\n    in div');
        console.error('Good day\n    in div');
        console.error('Bye');
        assertConsoleErrorDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Missing component stack for:
          "Bye"

        If this error should omit a component stack, pass [log, {withoutStack: true}].
        If all errors should omit the component stack, add {withoutStack: true} to the assertConsoleErrorDev call."
      `);
    });
    // @gate __DEV__
    it('fails if last error does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hello');
        console.error('Good day\n    in div');
        console.error('Bye\n    in div');
        assertConsoleErrorDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Missing component stack for:
          "Hello"

        If this error should omit a component stack, pass [log, {withoutStack: true}].
        If all errors should omit the component stack, add {withoutStack: true} to the assertConsoleErrorDev call."
      `);
    });
    // @gate __DEV__
    it('fails if middle error does not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
        assertConsoleErrorDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Missing component stack for:
          "Good day"

        If this error should omit a component stack, pass [log, {withoutStack: true}].
        If all errors should omit the component stack, add {withoutStack: true} to the assertConsoleErrorDev call."
      `);
    });
    // @gate __DEV__
    it('fails if all errors do not contain a stack', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hello');
        console.error('Good day');
        console.error('Bye');
        assertConsoleErrorDev(['Hello', 'Good day', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Missing component stack for:
          "Hello"

        Missing component stack for:
          "Good day"

        Missing component stack for:
          "Bye"

        If this error should omit a component stack, pass [log, {withoutStack: true}].
        If all errors should omit the component stack, add {withoutStack: true} to the assertConsoleErrorDev call."
      `);
    });

    // @gate __DEV__
    it('regression: checks entire string, not just the first letter', async () => {
      const message = expectToThrowFailure(() => {
        console.error('Message that happens to contain a "T"\n    in div');

        assertConsoleErrorDev([
          'This is a completely different message that happens to start with "T"',
        ]);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Unexpected error(s) recorded.

        - Expected errors
        + Received errors

        - This is a completely different message that happens to start with "T"
        + Message that happens to contain a "T"     in div (at **)"
      `);
    });

    describe('global withoutStack', () => {
      // @gate __DEV__
      it('passes if errors without stack explicitly opt out', () => {
        console.error('Hello');
        assertConsoleErrorDev(['Hello'], {withoutStack: true});

        console.error('Hello');
        console.error('Good day');
        console.error('Bye');

        assertConsoleErrorDev(['Hello', 'Good day', 'Bye'], {
          withoutStack: true,
        });
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid null value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev(['Hi'], {withoutStack: null});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":null}."
        `);
        assertConsoleErrorDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid {} value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev(['Hi'], {withoutStack: {}});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":{}}."
        `);
        assertConsoleErrorDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid string value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev(['Hi'], {withoutStack: 'haha'});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          The second argument must be {withoutStack: true}.

          Instead received {"withoutStack":"haha"}."
        `);
        assertConsoleErrorDev(['Hi'], {withoutStack: true});
      });

      // @gate __DEV__
      it('fails if only error is not expected to have a stack, but does', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello\n    in div');
          assertConsoleErrorDev(['Hello'], {withoutStack: true});
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          If this error should include a component stack, remove {withoutStack: true} from this error.
          If all errors should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleErrorDev call."
        `);
      });

      // @gate __DEV__
      it('fails if errors are not expected to have a stack, but some do', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello\n    in div');
          console.error('Good day');
          console.error('Bye\n    in div');
          assertConsoleErrorDev(['Hello', 'Good day', 'Bye'], {
            withoutStack: true,
          });
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          Unexpected component stack for:
            "Bye
              in div (at **)"

          If this error should include a component stack, remove {withoutStack: true} from this error.
          If all errors should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleErrorDev call."
        `);
      });
    });
    describe('local withoutStack', () => {
      // @gate __DEV__
      it('passes when expected withoutStack logs matches the actual logs', () => {
        console.error('Hello\n    in div');
        console.error('Good day');
        console.error('Bye\n    in div');
        assertConsoleErrorDev([
          'Hello',
          ['Good day', {withoutStack: true}],
          'Bye',
        ]);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid null value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev([['Hi', {withoutStack: null}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":null}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid {} value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev([['Hi', {withoutStack: {}}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":{}}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid string value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev([['Hi', {withoutStack: 'haha'}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":"haha"}]."
        `);
      });

      // @gate __DEV__
      it('fails if withoutStack is invalid number value', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hi');
          assertConsoleErrorDev([['Hi', {withoutStack: 4}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Log entries that are arrays must be of the form [string, {withoutStack: true}]

          Instead received [string, {"withoutStack":4}]."
        `);
      });

      // @gate __DEV__
      it('fails if you forget to wrap local withoutStack in array', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello\n    in div');
          console.error('Bye\n    in div');
          assertConsoleErrorDev(['Hello', {withoutStack: true}, 'Bye']);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Did you forget to wrap a log with withoutStack in an array?

          The expected message for assertConsoleErrorDev() must be a string or an array of length 2.

          Instead received {"withoutStack":true}."
        `);
      });

      // @gate __DEV__
      it('fails if you wrap in an array unnecessarily', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello');
          assertConsoleErrorDev([['Hello']]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Did you forget to remove the array around the log?

          The expected message for assertConsoleErrorDev() must be a string or an array of length 2, but there's only one item in the array. If this is intentional, remove the extra array."
        `);
      });

      // @gate __DEV__
      it('fails if only error is not expected to have a stack, but does', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello\n    in div');
          assertConsoleErrorDev([['Hello', {withoutStack: true}]]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          If this error should include a component stack, remove {withoutStack: true} from this error.
          If all errors should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleErrorDev call."
        `);
      });

      // @gate __DEV__
      it('fails if errors are not expected to have a stack, but some do', () => {
        const message = expectToThrowFailure(() => {
          console.error('Hello\n    in div');
          console.error('Good day');
          console.error('Bye\n    in div');
          assertConsoleErrorDev([
            [
              'Hello',
              {
                withoutStack: true,
              },
            ],
            'Good day',
            [
              'Bye',
              {
                withoutStack: true,
              },
            ],
          ]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Unexpected component stack for:
            "Hello
              in div (at **)"

          Unexpected component stack for:
            "Bye
              in div (at **)"

          If this error should include a component stack, remove {withoutStack: true} from this error.
          If all errors should include the component stack, you may need to remove {withoutStack: true} from the assertConsoleErrorDev call."
        `);
      });

      // @gate __DEV__
      it('fails with a helpful error message if the expected error message mismatches', () => {
        const message = expectToThrowFailure(() => {
          console.error('Bye\n    in div');
          assertConsoleErrorDev([
            [
              'Hello',
              {
                withoutStack: true,
              },
            ],
          ]);
        });
        expect(message).toMatchInlineSnapshot(`
          "assertConsoleErrorDev(expected)

          Unexpected error(s) recorded.

          - Expected errors
          + Received errors

          - Hello
          + Bye     in div (at **)"
        `);
      });
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s', 'Sara', 'extra');
        assertConsoleErrorDev(['Hi'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the args is greater than %s argument number for multiple errors', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s', 'Sara', 'extra');
        console.error('Bye %s', 'Sara', 'extra');
        assertConsoleErrorDev(['Hi', 'Bye'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received 2 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 2 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s');
        assertConsoleErrorDev(['Hi'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s""
      `);
    });

    // @gate __DEV__
    it('fails if the %s argument number is greater than args for multiple errors', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s');
        console.error('Bye %s');
        assertConsoleErrorDev(['Hi', 'Bye'], {withoutStack: true});
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received 0 arguments for a message with 1 placeholders:
          "Hi %s"

        Received 0 arguments for a message with 1 placeholders:
          "Bye %s""
      `);
    });

    // @gate __DEV__
    it('fails if component stack is passed twice', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s%s', '\n    in div', '\n    in div');
        assertConsoleErrorDev(['Hi']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received more than one component stack for a warning:
          "Hi %s%s""
      `);
    });

    // @gate __DEV__
    it('fails if multiple logs pass component stack twice', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi %s%s', '\n    in div', '\n    in div');
        console.error('Bye %s%s', '\n    in div', '\n    in div');
        assertConsoleErrorDev(['Hi', 'Bye']);
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Received more than one component stack for a warning:
          "Hi %s%s"

        Received more than one component stack for a warning:
          "Bye %s%s""
      `);
    });

    // @gate __DEV__
    it('fails if multiple strings are passed without an array wrapper for single log', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev('Hi', 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleErrorDev(['Hi', 'Bye']);
    });

    // @gate __DEV__
    it('fails if multiple strings are passed without an array wrapper for multiple logs', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev('Hi', 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleErrorDev(['Hi', 'Bye']);
    });

    // @gate __DEV__
    it('fails on more than two arguments', () => {
      const message = expectToThrowFailure(() => {
        console.error('Hi \n    in div');
        console.error('Wow \n    in div');
        console.error('Bye \n    in div');
        assertConsoleErrorDev('Hi', undefined, 'Bye');
      });
      expect(message).toMatchInlineSnapshot(`
        "assertConsoleErrorDev(expected)

        Expected messages should be an array of strings but was given type "string"."
      `);
      assertConsoleErrorDev(['Hi', 'Wow', 'Bye']);
    });

    it('should fail if waitFor is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.error('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitFor(['foo', 'bar']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.error was called without assertConsoleErrorDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });

    it('should fail if waitForThrow is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      function BadRender() {
        throw new Error('Oh no!');
      }

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <BadRender />
            <Yield id="C" />
            <Yield id="D" />
          </div>
        );
      }

      const root = ReactNoop.createRoot();
      root.render(<App />);

      console.error('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForThrow('Oh no!');
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.error was called without assertConsoleErrorDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['A', 'B', 'A', 'B']);
    });

    it('should fail if waitForPaint is called before asserting', async () => {
      function App({prop}) {
        const deferred = useDeferredValue(prop);
        const text = `Urgent: ${prop}, Deferred: ${deferred}`;
        Scheduler.log(text);
        return text;
      }

      const root = ReactNoop.createRoot();
      root.render(<App prop="A" />);

      await waitForAll(['Urgent: A, Deferred: A']);
      expect(root).toMatchRenderedOutput('Urgent: A, Deferred: A');

      // This update will result in two separate paints: an urgent one, and a
      // deferred one.
      root.render(<App prop="B" />);

      console.error('Not asserted');
      const message = await awaitExpectToThrowFailure(async () => {
        await waitForPaint(['Urgent: B, Deferred: A']);
      });

      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.error was called without assertConsoleErrorDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['Urgent: B, Deferred: A', 'Urgent: B, Deferred: B']);
    });

    it('should fail if waitForAll is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      console.error('Not asserted');

      const message = await awaitExpectToThrowFailure(async () => {
        await waitForAll(['foo', 'bar', 'baz']);
      });
      expect(message).toMatchInlineSnapshot(`
        "asserConsoleLogsCleared(expected)

        console.error was called without assertConsoleErrorDev:
        + Not asserted

        You must call one of the assertConsoleDev helpers between each act call."
      `);

      await waitForAll(['foo', 'bar', 'baz']);
    });
    it('should fail if toMatchRenderedOutput is called before asserting', async () => {
      const Yield = ({id}) => {
        Scheduler.log(id);
        console.error('Not asserted');
        return id;
      };

      const root = ReactNoop.createRoot();
      startTransition(() => {
        root.render(
          <div>
            <Yield id="foo" />
            <Yield id="bar" />
            <Yield id="baz" />
          </div>
        );
      });

      assertLog([]);

      await waitForAll(['foo', 'bar', 'baz']);
      const message = expectToThrowFailure(() => {
        expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
      });
      if (!__DEV__) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.error was called without assertConsoleErrorDev:
          + Not asserted
          + Not asserted
          + Not asserted

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else if (gate(flags => flags.enableOwnerStacks)) {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.error was called without assertConsoleErrorDev:
          + Not asserted%s,
          +     in Yield (at **)
          + Not asserted%s,
          +     in Yield (at **)
          + Not asserted%s,
          +     in Yield (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      } else {
        expect(message).toMatchInlineSnapshot(`
          "asserConsoleLogsCleared(expected)

          console.error was called without assertConsoleErrorDev:
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)
          + Not asserted%s,
          +     in Yield (at **)
          +     in div (at **)

          You must call one of the assertConsoleDev helpers between each act call."
        `);
      }

      expect(root).toMatchRenderedOutput(<div>foobarbaz</div>);
    });
  });
});
