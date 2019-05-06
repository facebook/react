// test() is part of Jest's serializer API
export function test(maybeStore) {
  // It's important to lazy-require the Store rather than imported at the head of the module.
  // Because we reset modules between tests, different Store implementations will be used for each test.
  // Unfortunately Jest does not reset its own serializer modules.
  return maybeStore instanceof require('src/devtools/store').default;
}

// print() is part of Jest's serializer API
export function print(store, serialize, indent) {
  return printStore(store);
}

export function printElement(element, includeWeight = false) {
  let prefix = ' ';
  if (element.children.length > 0) {
    prefix = element.isCollapsed ? '▸' : '▾';
  }

  let key = '';
  if (element.key !== null) {
    key = ` key="${element.key}"`;
  }

  let suffix = '';
  if (includeWeight) {
    suffix = ` (${element.isCollapsed ? 1 : element.weight})`;
  }

  return `${'  '.repeat(element.depth + 1)}${prefix} <${element.displayName ||
    'null'}${key}>${suffix}`;
}

export function printOwnersList(elements, includeWeight = false) {
  return elements
    .map(element => printElement(element, includeWeight))
    .join('\n');
}

// Used for Jest snapshot testing.
// May also be useful for visually debugging the tree, so it lives on the Store.
export function printStore(store, includeWeight = false) {
  const snapshotLines = [];

  let rootWeight = 0;

  store.roots.forEach(rootID => {
    const { weight } = store.getElementByID(rootID);

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
