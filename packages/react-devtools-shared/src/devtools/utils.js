// @flow

import type { Element } from './views/Components/types';
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

  let hocs = '';
  if (element.hocDisplayNames !== null) {
    hocs = ` [${element.hocDisplayNames.join('][')}]`;
  }

  let suffix = '';
  if (includeWeight) {
    suffix = ` (${element.isCollapsed ? 1 : element.weight})`;
  }

  return `${'  '.repeat(element.depth + 1)}${prefix} <${element.displayName ||
    'null'}${key}>${hocs}${suffix}`;
}

export function printOwnersList(elements: Array<Element>, includeWeight: boolean = false) {
  return elements
    .map(element => printElement(element, includeWeight))
    .join('\n');
}

export function printStore(store: Store, includeWeight: boolean = false) {
  const snapshotLines = [];

  let rootWeight = 0;

  store.roots.forEach(rootID => {
    const { weight } = ((store.getElementByID(rootID): any): Element);

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
      `Inconsistent Store state. Individual root weights (${rootWeight}) do not match total weight (${
        store.numElements
      })`
    );
  }

  // If roots have been unmounted, verify that they've been removed from maps.
  // This helps ensure the Store doesn't leak memory.
  store.assertExpectedRootMapSizes();

  return snapshotLines.join('\n');
}