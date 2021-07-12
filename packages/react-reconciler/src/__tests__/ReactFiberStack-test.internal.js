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

let ReactFiberStack;

describe('ReactFiberStack', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFiberStack = require('../ReactFiberStack.new');
  });

  it('creates a cursor with the given default value', () => {
    const defaultValue = {foo: 3};
    expect(ReactFiberStack.createCursor(defaultValue)).toEqual({
      current: defaultValue,
    });
  });

  it('initializes the stack empty', () => {
    expect(ReactFiberStack.isEmpty()).toEqual(true);
  });

  describe('stack manipulations', () => {
    let cursor;
    let fiber;
    beforeEach(() => {
      cursor = ReactFiberStack.createCursor(null);
      fiber = {};
    });

    it('pushes an element and the stack is not empty', () => {
      ReactFiberStack.push(cursor, true, fiber);
      expect(ReactFiberStack.isEmpty()).toEqual(false);
    });

    it('pushes an element and assigns the value to the cursor', () => {
      const pushedElement = {foo: 3};
      ReactFiberStack.push(cursor, pushedElement, fiber);
      expect(cursor.current).toEqual(pushedElement);
    });

    it('pushes an element, pops it back and the stack is empty', () => {
      ReactFiberStack.push(cursor, true, fiber);
      ReactFiberStack.pop(cursor, fiber);
      expect(ReactFiberStack.isEmpty()).toEqual(true);
    });

    it('pushes an element, pops it back and the cursor has its initial value', () => {
      const initialCursorValue = 'foo';
      cursor.current = initialCursorValue;
      ReactFiberStack.push(cursor, true, fiber);
      ReactFiberStack.pop(cursor, fiber);
      expect(cursor.current).toEqual(initialCursorValue);
    });
  });
});
