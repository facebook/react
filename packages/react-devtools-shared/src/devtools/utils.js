/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Element} from './views/Components/types';
import type Store from './store';

export function printElement(element: Element, includeWeight: boolean = false) {
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
) {
  return elements
    .map(element => printElement(element, includeWeight))
    .join('\n');
}

export function printStore(store: Store, includeWeight: boolean = false) {
  const snapshotLines = [];

  let rootWeight = 0;

  store.roots.forEach(rootID => {
    const {weight} = ((store.getElementByID(rootID): any): Element);

    snapshotLines.push('[root]' + (includeWeight ? ` (${weight})` : ''));

    for (let i = rootWeight; i < rootWeight + weight; i++) {
      const element = store.getElementAtIndex(i);

      if (element == null) {
        throw Error(`Could not find element at index ${i}`);
      }

      snapshotLines.push(printElement(element, includeWeight));
    }

    rootWeight += weight;
  });

  // Make sure the pretty-printed test align with the Store's reported number of total rows.
  if (rootWeight !== store.numElements) {
    throw Error(
      `Inconsistent Store state. Individual root weights (${rootWeight}) do not match total weight (${store.numElements})`,
    );
  }

  // If roots have been unmounted, verify that they've been removed from maps.
  // This helps ensure the Store doesn't leak memory.
  store.assertExpectedRootMapSizes();

  return snapshotLines.join('\n');
}

// We use JSON.parse to parse string values
// e.g. 'foo' is not valid JSON but it is a valid string
// so this method replaces e.g. 'foo' with "foo"
export function sanitizeForParse(value: any) {
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

export function smartParse(value: any) {
  switch (value) {
    case 'Infinity':
      return Infinity;
    case 'NaN':
      return NaN;
    case 'undefined':
      return undefined;
    default:
      return JSON.parse(sanitizeForParse(value));
  }
}

export function smartStringify(value: any) {
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
