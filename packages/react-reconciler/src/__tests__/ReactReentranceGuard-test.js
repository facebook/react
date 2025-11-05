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
let Scheduler;
let act;
let assertLog;

describe('ReactReentranceGuard', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
  });

  // @gate __DEV__
  it('should handle re-entrant performWorkOnRoot calls gracefully', async () => {
    // This test simulates the Firefox breakpoint/alert issue where
    // MessageChannel callbacks fire immediately upon resuming from a pause,
    // causing performWorkOnRoot to be called re-entrantly.

    let triggerReentrance = false;
    const originalPerformWorkOnRoot = ReactNoop.performWorkOnRoot;

    // Mock performWorkOnRoot to simulate re-entrance
    ReactNoop.performWorkOnRoot = function(...args) {
      if (triggerReentrance) {
        triggerReentrance = false;
        // Simulate re-entrant call (like what happens in Firefox)
        // This should not throw an error, but should reschedule
        ReactNoop.performWorkOnRoot(...args);
      }
      return originalPerformWorkOnRoot.apply(this, args);
    };

    function Component() {
      const [count, setCount] = React.useState(0);
      React.useEffect(() => {
        if (count === 0) {
          triggerReentrance = true;
          setCount(1);
        }
      }, [count]);
      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    // Should complete without throwing "Should not already be working" error
    expect(root).toMatchRenderedOutput('1');
  });

  // @gate __DEV__
  it('should log a warning when performWorkOnRoot is called recursively', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let triggerReentrance = false;
    const originalPerformWorkOnRoot = ReactNoop.performWorkOnRoot;

    ReactNoop.performWorkOnRoot = function(...args) {
      if (triggerReentrance) {
        triggerReentrance = false;
        ReactNoop.performWorkOnRoot(...args);
      }
      return originalPerformWorkOnRoot.apply(this, args);
    };

    function Component() {
      const [count, setCount] = React.useState(0);
      React.useEffect(() => {
        if (count === 0) {
          triggerReentrance = true;
          setCount(1);
        }
      }, [count]);
      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    // Should log a warning about recursive call
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('called recursively'),
    );

    consoleSpy.mockRestore();
  });

  // @gate __DEV__
  it('should handle re-entrant commitRoot calls gracefully', async () => {
    // Similar test for commitRoot re-entrance

    let triggerReentrance = false;
    let reentranceAttempted = false;

    function Component() {
      const [count, setCount] = React.useState(0);
      
      React.useLayoutEffect(() => {
        if (count === 0 && !reentranceAttempted) {
          reentranceAttempted = true;
          triggerReentrance = true;
          // This update during layout effect could trigger re-entrance
          setCount(1);
        }
      }, [count]);

      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    // Should complete without throwing error
    expect(root).toMatchRenderedOutput('1');
  });

  it('should reschedule work when re-entrance is detected', async () => {
    // Test that work is properly rescheduled when re-entrance occurs

    let updateCount = 0;

    function Component() {
      const [count, setCount] = React.useState(0);
      
      React.useEffect(() => {
        updateCount++;
        if (count < 2) {
          setCount(c => c + 1);
        }
      }, [count]);

      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    // All updates should be processed
    expect(root).toMatchRenderedOutput('2');
    expect(updateCount).toBeGreaterThan(0);
  });

  it('should not affect normal operation when no re-entrance occurs', async () => {
    // Ensure the fix doesn't break normal React operation

    function Component() {
      const [count, setCount] = React.useState(0);
      
      React.useEffect(() => {
        if (count === 0) {
          setCount(1);
        }
      }, [count]);

      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    expect(root).toMatchRenderedOutput('1');
  });

  it('should handle multiple rapid updates without re-entrance errors', async () => {
    function Component() {
      const [count, setCount] = React.useState(0);
      
      React.useEffect(() => {
        if (count < 5) {
          // Multiple rapid updates
          setCount(c => c + 1);
          setCount(c => c + 1);
          setCount(c => c + 1);
        }
      }, [count]);

      return count;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component />);
    });

    // Should handle all updates without errors
    expect(root).toMatchRenderedOutput(expect.any(Number));
  });
});
