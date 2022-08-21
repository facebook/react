/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

type Heap = Array<Node>;
type Node = {|
  id: number,
  sortIndex: number,
|};

export function push(heap: Heap, node: Node): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

export function peek(heap: Heap): Node | null {
  return heap.length === 0 ? null : heap[0];
}

export function pop(heap: Heap): Node | null {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }
  return first;
}

function siftUp(heap, node, i) {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      break;
    }
  }
  heap[index] = node;
}

function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    let childIndex = (index + 1) * 2 - 1;
    if (
      childIndex + 1 < length &&
      compare(heap[childIndex + 1], heap[childIndex]) < 0
    ) {
      childIndex += 1;
    }
    const childNode = heap[childIndex];
    if (compare(childNode, node) < 0) {
      heap[index] = childNode;
      index = childIndex;
    } else {
      // Neither child is smaller. Exit.
      break;
    }
  }
  heap[index] = node;
}

function compare(a, b) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
