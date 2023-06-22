/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let determineComponentFrameFromStack;

describe('Determine component stack trace line', () => {
  const initialStackTraceLimit = Error.stackTraceLimit;

  beforeEach(() => {
    // Reset V8's stack trace limit in-between tests
    Error.stackTraceLimit = initialStackTraceLimit;

    // Reset displayName property
    delete TestComponent.displayName;

    determineComponentFrameFromStack =
      require('../ReactComponentStackFrame').determineComponentFrameFromStack;
  });

  function TestComponent() {
    throw new Error('TestComponent called');
  }

  // Runs a function within nested `times` alternating function calls. This is
  // done so we get longer, more interesting/differing traces between sample and
  // control stack traces in our tests below.
  function flipFlop(times: number, fn: Function): void {
    function flip() {
      if (times > 0) {
        times--;
        flop();
      } else {
        fn();
      }
    }
    function flop() {
      if (times > 0) {
        times--;
        flip();
      } else {
        fn();
      }
    }
  }

  it('should determine the component in a normal (i.e. not truncated) stack trace', () => {
    let controlStack;
    try {
      throw new Error();
    } catch (controlError) {
      controlStack = controlError.stack;
    }
    try {
      TestComponent();
    } catch (sampleError) {
      expect(
        determineComponentFrameFromStack(
          TestComponent,
          sampleError.stack,
          controlStack,
        ),
      ).toMatch('at TestComponent (');
    }
  });

  it('replaces <anonymous> labels with the component displayName', () => {
    let controlStack;
    try {
      throw new Error();
    } catch (controlError) {
      controlStack = controlError.stack;
    }
    try {
      TestComponent();
    } catch (sampleError) {
      const sampleStack = sampleError.stack.replace(
        'at TestComponent (',
        'at <anonymous> (',
      );
      // If displayName is not set, then nothing should be modified
      expect(
        determineComponentFrameFromStack(
          TestComponent,
          sampleStack,
          controlStack,
        ),
      ).toMatch('at <anonymous> (');

      // Setting a displayName property should replace <anonymous>
      TestComponent.displayName = 'TestComponent';
      expect(
        determineComponentFrameFromStack(
          TestComponent,
          sampleStack,
          controlStack,
        ),
      ).toMatch('at TestComponent (');
    }
  });

  it('should determine the component in a bottom-truncated stack trace', () => {
    Error.stackTraceLimit = 10;
    flipFlop(20, () => {
      let controlStack;
      try {
        throw new Error();
      } catch (controlError) {
        controlStack = controlError.stack;
        // Ensure V8 is actually truncating traces. The `+1` here is for the
        // line containing the error message.
        expect(controlStack.split('\n')).toHaveLength(
          Error.stackTraceLimit + 1,
        );
      }
      try {
        TestComponent();
      } catch (sampleError) {
        expect(
          determineComponentFrameFromStack(
            TestComponent,
            sampleError.stack,
            controlStack,
          ),
        ).toMatch('at TestComponent (');
      }
    });
  });

  it('should determine the component in a middle-truncated stack trace', () => {
    function truncateTraceFromMiddle(trace: string, numLines: number): string {
      const lines = trace.split('\n');
      const partLines = Math.floor(numLines / 2);
      const first = lines.slice(0, partLines);
      first.push(`\n    ... skipping ${numLines} frames`);
      const last = lines.slice(-partLines);
      return first.concat(last).join('\n');
    }

    flipFlop(20, () => {
      let controlStack;
      try {
        throw new Error();
      } catch (controlError) {
        // Sanity check.
        expect(controlError.stack.split('\n').length > 10).toEqual(true);
        controlStack = truncateTraceFromMiddle(controlError.stack, 10);
      }
      try {
        TestComponent();
      } catch (sampleError) {
        // Sanity check.
        expect(sampleError.stack.split('\n').length > 10).toEqual(true);
        expect(
          determineComponentFrameFromStack(
            TestComponent,
            truncateTraceFromMiddle(sampleError.stack, 10),
            controlStack,
          ),
        ).toMatch('at TestComponent (');
      }
    });
  });
});
