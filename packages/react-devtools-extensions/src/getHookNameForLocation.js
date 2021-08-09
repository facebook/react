/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {
  HookMap,
  HookMapEntry,
  HookMapLine,
  HookMapMappings,
} from './generateHookMap';
import type {Position} from './astUtils';
import {NO_HOOK_NAME} from './astUtils';

export function getHookNameForLocation(
  location: Position,
  hookMap: HookMap,
): string | null {
  const {names, mappings} = hookMap;

  const foundLine = binSearch(location, mappings, compareLinePositions);
  if (foundLine == null) {
    throw new Error(
      `Expected to find a line in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }

  let foundEntry;
  const foundLineNumber = getLineNumberFromLine(foundLine);
  if (foundLineNumber != location.line) {
    foundEntry = foundLine[foundLine.length - 1];
  } else {
    foundEntry = binSearch(location, foundLine, compareColumnPositions);
  }

  if (foundEntry == null) {
    throw new Error(
      `Expected to find a mapping in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }

  const foundNameIndex = foundEntry[2];
  if (foundNameIndex == null) {
    throw new Error(
      `Expected to find a name index in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }
  const foundName = hookMap.names[foundNameIndex];
  if (foundName == null) {
    throw new Error(
      `Expected to find a name in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }

  if (foundName === NO_HOOK_NAME) {
    return null;
  }
  return foundName;
}

function binSearch<T>(
  location: Position,
  items: T[],
  compare: (
    location: Position,
    items: T[],
    index: number,
  ) => {|index: number | null, direction: number|},
): T | null {
  let count = items.length;
  let index = 0;
  let firstElementIndex = 0;
  let step;

  while (count > 0) {
    index = firstElementIndex;
    step = Math.floor(count / 2);
    index += step;

    const comparison = compare(location, items, index);
    if (comparison.direction === 0) {
      if (comparison.index == null) {
        throw new Error('Expected an index when matching element is found.');
      }
      firstElementIndex = comparison.index;
      break;
    }

    if (comparison.direction > 0) {
      index++;
      firstElementIndex = index;
      count -= step + 1;
    } else {
      count = step;
    }
  }

  return firstElementIndex != null ? items[firstElementIndex] : null;
}

function compareLinePositions(
  location: Position,
  mappings: HookMapMappings,
  index: number,
): {|index: number | null, direction: number|} {
  const startIndex = index;
  const start = mappings[startIndex];
  if (start == null) {
    throw new Error(`Unexpected line missing in HookMap at index ${index}.`);
  }
  const startLine = getLineNumberFromLine(start);

  let endLine;
  let endIndex = index + 1;
  const end = mappings[endIndex];
  if (end != null) {
    endLine = getLineNumberFromLine(end);
  } else {
    endIndex = startIndex;
    endLine = startLine;
  }

  if (startLine === location.line) {
    return {index: startIndex, direction: 0};
  }

  if (endLine === location.line) {
    return {index: endIndex, direction: 0};
  }

  if (location.line > endLine && end == null) {
    return {index: endIndex, direction: 0};
  }

  if (startLine < location.line && location.line < endLine) {
    return {index: startIndex, direction: 0};
  }

  return {index: null, direction: location.line - startLine};
}

function compareColumnPositions(
  location: Position,
  line: HookMapLine,
  index: number,
): {|index: number | null, direction: number|} {
  const startIndex = index;
  const start = line[index];
  if (start == null) {
    throw new Error(
      `Unexpected mapping missing in HookMap line at index ${index}.`,
    );
  }
  const startColumn = getColumnNumberFromEntry(start);

  let endColumn;
  let endIndex = index + 1;
  const end = line[endIndex];
  if (end != null) {
    endColumn = getColumnNumberFromEntry(end);
  } else {
    endIndex = startIndex;
    endColumn = startColumn;
  }

  if (startColumn === location.column) {
    return {index: startIndex, direction: 0};
  }

  if (endColumn === location.column) {
    return {index: endIndex, direction: 0};
  }

  if (location.column > endColumn && end == null) {
    return {index: endIndex, direction: 0};
  }

  if (startColumn < location.column && location.column < endColumn) {
    return {index: startIndex, direction: 0};
  }

  return {index: null, direction: location.column - startColumn};
}

function getLineNumberFromLine(line: HookMapLine): number {
  return getLineNumberFromEntry(line[0]);
}

function getLineNumberFromEntry(entry: HookMapEntry): number {
  const lineNumber = entry[0];
  if (lineNumber == null) {
    throw new Error('Unexpected line number missing in entry in HookMap');
  }
  return lineNumber;
}

function getColumnNumberFromEntry(entry: HookMapEntry): number {
  const columnNumber = entry[1];
  if (columnNumber == null) {
    throw new Error('Unexpected column number missing in entry in HookMap');
  }
  return columnNumber;
}

function getHookNameIndexFromEntry(entry: HookMapEntry): number {
  const hookNameIndex = entry[2];
  if (hookNameIndex == null) {
    throw new Error('Unexpected hook name index missing in entry in HookMap');
  }
  return hookNameIndex;
}
