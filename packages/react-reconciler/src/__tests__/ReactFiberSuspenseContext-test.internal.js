/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */
'use strict';

let ReactFiberSuspenseContext;

describe('ReactFiberSuspenseContext', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFiberSuspenseContext = require('../ReactFiberSuspenseContext.new');
  });

  describe('suspense context stack', () => {
    let someContext;
    let fiber;
    let suspenseStackCursor;
    beforeEach(() => {
      someContext = 0b1000;
      fiber = {};
      suspenseStackCursor = ReactFiberSuspenseContext.suspenseStackCursor;
    });

    it('pushes the context and assigns the value to the cursor', () => {
      ReactFiberSuspenseContext.pushSuspenseContext(fiber, someContext);
      expect(suspenseStackCursor).toEqual({
        current: someContext,
      });
    });

    it('pushes and pops and sets the cursor to its initial value', () => {
      const initialValue = suspenseStackCursor.current;
      ReactFiberSuspenseContext.pushSuspenseContext(fiber, someContext);
      ReactFiberSuspenseContext.popSuspenseContext(fiber);
      expect(suspenseStackCursor).toEqual({
        current: initialValue,
      });
    });
  });

  describe('hasSuspenseContext', () => {
    it('is true for parent context and its subtree context', () => {
      const subtree = 0b1000;
      const parent = ReactFiberSuspenseContext.addSubtreeSuspenseContext(
        0b10000,
        subtree,
      );
      expect(
        ReactFiberSuspenseContext.hasSuspenseContext(parent, subtree),
      ).toEqual(true);
    });

    it('is false for two different context', () => {
      expect(
        ReactFiberSuspenseContext.hasSuspenseContext(0b1000, 0b10000),
      ).toEqual(false);
    });
  });
});
