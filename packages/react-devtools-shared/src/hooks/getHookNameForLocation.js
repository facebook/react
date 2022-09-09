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

/**
 * Finds the Hook name assigned to a given location in the source code,
 * and a HookMap extracted from an extended source map.
 * The given location must correspond to the location in the *original*
 * source code (i.e. *not* the generated one).
 *
 * Note that all locations in the source code are guaranteed to map
 * to a name, including a sentinel value that represents a missing
 * Hook name: '<no-hook>'.
 *
 * For more details on the format of the HookMap, see generateHookMap
 * and the tests for that function and this function.
 */
export function getHookNameForLocation(
  location: Position,
  hookMap: HookMap,
): string | null {
  const {names, mappings} = hookMap;

  // The HookMap mappings are grouped by lines, so first we look up
  // which line of mappings covers the target location.
  // Note that we expect to find a line since all the locations in the
  // source code are guaranteed to map to a name, including a '<no-hook>'
  // name.
  const foundLine = binSearch(location, mappings, compareLinePositions);
  if (foundLine == null) {
    throw new Error(
      `Expected to find a line in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }

  let foundEntry;
  const foundLineNumber = getLineNumberFromLine(foundLine);
  // The line found in the mappings will never be larger than the target
  // line, and vice-versa, so if the target line doesn't match the found
  // line, we immediately know that it must correspond to the last mapping
  // entry for that line.
  if (foundLineNumber !== location.line) {
    foundEntry = foundLine[foundLine.length - 1];
  } else {
    foundEntry = binSearch(location, foundLine, compareColumnPositions);
  }

  if (foundEntry == null) {
    throw new Error(
      `Expected to find a mapping in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }

  const foundNameIndex = getHookNameIndexFromEntry(foundEntry);
  if (foundNameIndex == null) {
    throw new Error(
      `Expected to find a name index in the HookMap that covers the target location at line: ${location.line}, column: ${location.column}`,
    );
  }
  const foundName = names[foundNameIndex];
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
  ) => {index: number | null, direction: number},
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

/**
 * Compares the target line location to the current location
 * given by the provided index.
 *
 * If the target line location matches the current location, returns
 * the index of the matching line in the mappings. In order for a line
 * to match, the target line must match the line exactly, or be within
 * the line range of the current line entries and the adjacent line
 * entries.
 *
 * If the line doesn't match, returns the search direction for the
 * next step in the binary search.
 */
function compareLinePositions(
  location: Position,
  mappings: HookMapMappings,
  index: number,
): {index: number | null, direction: number} {
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

  // When the line matches exactly, return the matching index
  if (startLine === location.line) {
    return {index: startIndex, direction: 0};
  }
  if (endLine === location.line) {
    return {index: endIndex, direction: 0};
  }

  // If we're at the end of the mappings, and the target line is greater
  // than the current line, then this final line must cover the
  // target location, so we return it.
  if (location.line > endLine && end == null) {
    return {index: endIndex, direction: 0};
  }

  // If the location is within the current line and the adjacent one,
  // we know that the target location must be covered by the current line.
  if (startLine < location.line && location.line < endLine) {
    return {index: startIndex, direction: 0};
  }

  // Otherwise, return the next direction in the search.
  return {index: null, direction: location.line - startLine};
}

/**
 * Compares the target column location to the current location
 * given by the provided index.
 *
 * If the target column location matches the current location, returns
 * the index of the matching entry in the mappings. In order for a column
 * to match, the target column must match the column exactly, or be within
 * the column range of the current entry and the adjacent entry.
 *
 * If the column doesn't match, returns the search direction for the
 * next step in the binary search.
 */
function compareColumnPositions(
  location: Position,
  line: HookMapLine,
  index: number,
): {index: number | null, direction: number} {
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

  // When the column matches exactly, return the matching index
  if (startColumn === location.column) {
    return {index: startIndex, direction: 0};
  }
  if (endColumn === location.column) {
    return {index: endIndex, direction: 0};
  }

  // If we're at the end of the entries for this line, and the target
  // column is greater than the current column, then this final entry
  // must cover the target location, so we return it.
  if (location.column > endColumn && end == null) {
    return {index: endIndex, direction: 0};
  }

  // If the location is within the current column and the adjacent one,
  // we know that the target location must be covered by the current entry.
  if (startColumn < location.column && location.column < endColumn) {
    return {index: startIndex, direction: 0};
  }

  // Otherwise, return the next direction in the search.
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
