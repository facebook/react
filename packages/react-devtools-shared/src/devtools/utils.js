/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import JSON5 from 'json5';

import type {Element} from './views/Components/types';
import type {StateContext} from './views/Components/TreeContext';
import type Store from './store';

export function printElement(
  element: Element,
  includeWeight: boolean = false,
): string {
  let prefix = ' ';
  if (element.children.length > 0) {
    prefix = element.isCollapsed ? '▸' : '▾';
  }

  let key = '';
  if (element.key !== null) {
    key = ` key="${element.key}"`;
  }

  let hocDisplayNames = null;
  if (element.hocDisplayNames !== null) {
    hocDisplayNames = [...element.hocDisplayNames];
  }

  const hocs =
    hocDisplayNames === null ? '' : ` [${hocDisplayNames.join('][')}]`;

  let suffix = '';
  if (includeWeight) {
    suffix = ` (${element.isCollapsed ? 1 : element.weight})`;
  }

  return `${'  '.repeat(element.depth + 1)}${prefix} <${element.displayName ||
    'null'}${key}>${hocs}${suffix}`;
}

export function printOwnersList(
  elements: Array<Element>,
  includeWeight: boolean = false,
): string {
  return elements
    .map(element => printElement(element, includeWeight))
    .join('\n');
}

export function printStore(
  store: Store,
  includeWeight: boolean = false,
  state: StateContext | null = null,
): string {
  const snapshotLines = [];

  let rootWeight = 0;

  function printSelectedMarker(index: number): string {
    if (state === null) {
      return '';
    }
    return state.selectedElementIndex === index ? `→` : ' ';
  }

  function printErrorsAndWarnings(element: Element): string {
    const {
      errorCount,
      warningCount,
    } = store.getErrorAndWarningCountForElementID(element.id);
    if (errorCount === 0 && warningCount === 0) {
      return '';
    }
    return ` ${errorCount > 0 ? '✕' : ''}${warningCount > 0 ? '⚠' : ''}`;
  }

  const ownerFlatTree = state !== null ? state.ownerFlatTree : null;
  if (ownerFlatTree !== null) {
    snapshotLines.push(
      '[owners]' + (includeWeight ? ` (${ownerFlatTree.length})` : ''),
    );
    ownerFlatTree.forEach((element, index) => {
      const printedSelectedMarker = printSelectedMarker(index);
      const printedElement = printElement(element, false);
      const printedErrorsAndWarnings = printErrorsAndWarnings(element);
      snapshotLines.push(
        `${printedSelectedMarker}${printedElement}${printedErrorsAndWarnings}`,
      );
    });
  } else {
    const errorsAndWarnings = store._errorsAndWarnings;
    if (errorsAndWarnings.size > 0) {
      let errorCount = 0;
      let warningCount = 0;
      errorsAndWarnings.forEach(entry => {
        errorCount += entry.errorCount;
        warningCount += entry.warningCount;
      });

      snapshotLines.push(`✕ ${errorCount}, ⚠ ${warningCount}`);
    }

    store.roots.forEach(rootID => {
      const {weight} = ((store.getElementByID(rootID): any): Element);
      const maybeWeightLabel = includeWeight ? ` (${weight})` : '';

      // Store does not (yet) expose a way to get errors/warnings per root.
      snapshotLines.push(`[root]${maybeWeightLabel}`);

      for (let i = rootWeight; i < rootWeight + weight; i++) {
        const element = store.getElementAtIndex(i);

        if (element == null) {
          throw Error(`Could not find element at index "${i}"`);
        }

        const printedSelectedMarker = printSelectedMarker(i);
        const printedElement = printElement(element, includeWeight);
        const printedErrorsAndWarnings = printErrorsAndWarnings(element);
        snapshotLines.push(
          `${printedSelectedMarker}${printedElement}${printedErrorsAndWarnings}`,
        );
      }

      rootWeight += weight;
    });

    // Make sure the pretty-printed test align with the Store's reported number of total rows.
    if (rootWeight !== store.numElements) {
      throw Error(
        `Inconsistent Store state. Individual root weights ("${rootWeight}") do not match total weight ("${store.numElements}")`,
      );
    }

    // If roots have been unmounted, verify that they've been removed from maps.
    // This helps ensure the Store doesn't leak memory.
    store.assertExpectedRootMapSizes();
  }

  return snapshotLines.join('\n');
}

// We use JSON.parse to parse string values
// e.g. 'foo' is not valid JSON but it is a valid string
// so this method replaces e.g. 'foo' with "foo"
export function sanitizeForParse(value: any): any | string {
  if (typeof value === 'string') {
    if (
      value.length >= 2 &&
      value.charAt(0) === "'" &&
      value.charAt(value.length - 1) === "'"
    ) {
      return '"' + value.substr(1, value.length - 2) + '"';
    }
  }
  return value;
}

export function smartParse(value: any): any | void | number {
  switch (value) {
    case 'Infinity':
      return Infinity;
    case 'NaN':
      return NaN;
    case 'undefined':
      return undefined;
    default:
      return JSON5.parse(sanitizeForParse(value));
  }
}

export function smartStringify(value: any): string {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return 'NaN';
    } else if (!Number.isFinite(value)) {
      return 'Infinity';
    }
  } else if (value === undefined) {
    return 'undefined';
  }

  return JSON.stringify(value);
}

// [url, row, column]
export type Stack = [string, number, number];

const STACK_DELIMETER = /\n\s+at /;
const STACK_SOURCE_LOCATION = /([^\s]+) \((.+):(.+):(.+)\)/;

export function stackToComponentSources(
  stack: string,
): Array<[string, ?Stack]> {
  const out = [];
  stack
    .split(STACK_DELIMETER)
    .slice(1)
    .forEach(entry => {
      const match = STACK_SOURCE_LOCATION.exec(entry);
      if (match) {
        const [, component, url, row, column] = match;
        out.push([component, [url, parseInt(row, 10), parseInt(column, 10)]]);
      } else {
        out.push([entry, null]);
      }
    });
  return out;
}
