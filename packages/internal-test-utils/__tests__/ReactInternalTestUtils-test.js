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

describe('ReactInternalTestUtils', () => {
  test('waitFor', async () => {
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

  test('waitForAll', async () => {
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

  test('waitForThrow', async () => {
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

  test('waitForPaint', async () => {
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

  test('assertLog', async () => {
    const Yield = ({id}) => {
      Scheduler.log(id);
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
    assertLog(['A', 'B', 'C']);
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
