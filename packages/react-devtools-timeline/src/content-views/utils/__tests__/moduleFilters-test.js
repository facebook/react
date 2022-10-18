/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isInternalModule} from '../moduleFilters';

describe('isInternalModule', () => {
  let map;

  function createFlamechartStackFrame(scriptUrl, locationLine, locationColumn) {
    return {
      name: 'test',
      timestamp: 0,
      duration: 1,
      scriptUrl,
      locationLine,
      locationColumn,
    };
  }

  function createStackFrame(fileName, lineNumber, columnNumber) {
    return {
      columnNumber: columnNumber,
      lineNumber: lineNumber,
      fileName: fileName,
      functionName: 'test',
      source: `    at test (${fileName}:${lineNumber}:${columnNumber})`,
    };
  }

  beforeEach(() => {
    map = new Map();
    map.set('foo', [
      [createStackFrame('foo', 10, 0), createStackFrame('foo', 15, 100)],
    ]);
    map.set('bar', [
      [createStackFrame('bar', 10, 0), createStackFrame('bar', 15, 100)],
      [createStackFrame('bar', 20, 0), createStackFrame('bar', 25, 100)],
    ]);
  });

  it('should properly identify stack frames within the provided module ranges', () => {
    expect(
      isInternalModule(map, createFlamechartStackFrame('foo', 10, 0)),
    ).toBe(true);
    expect(
      isInternalModule(map, createFlamechartStackFrame('foo', 12, 35)),
    ).toBe(true);
    expect(
      isInternalModule(map, createFlamechartStackFrame('foo', 15, 100)),
    ).toBe(true);
    expect(
      isInternalModule(map, createFlamechartStackFrame('bar', 12, 0)),
    ).toBe(true);
    expect(
      isInternalModule(map, createFlamechartStackFrame('bar', 22, 125)),
    ).toBe(true);
  });

  it('should properly identify stack frames outside of the provided module ranges', () => {
    expect(isInternalModule(map, createFlamechartStackFrame('foo', 9, 0))).toBe(
      false,
    );
    expect(
      isInternalModule(map, createFlamechartStackFrame('foo', 15, 101)),
    ).toBe(false);
    expect(
      isInternalModule(map, createFlamechartStackFrame('bar', 17, 0)),
    ).toBe(false);
    expect(
      isInternalModule(map, createFlamechartStackFrame('baz', 12, 0)),
    ).toBe(false);
  });
});
