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
  let parentIndex = (index - 1) >>> 1;
  // The parent is larger and index more than 0. Swap positions.
  while (index > 0 && compare(heap[parentIndex], node) > 0) {
    swap(heap, parentIndex, index);
    index = parentIndex;
    parentIndex = (index - 1) >>> 1;
  }
}

function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index << 1) + 1;
    const rightIndex = leftIndex + 1;
    // Find least index.Assume left child is least.
    let leastIndex = leftIndex;
    if (rightIndex < length && compare(heap[rightIndex], heap[leftIndex]) < 0) {
      leastIndex = rightIndex;
    }
    // Least greater or equal to node.Exit.
    if (compare(heap[leastIndex], node) >= 0) return;
    // Swap node and least.
    swap(heap, leastIndex, index);
    index = leastIndex;
  }
}

function compare(a, b) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
function swap(heap: Heap, indexA, indexB) {
  const temp = heap[indexA];
  heap[indexA] = heap[indexB];
  heap[indexB] = temp;
}
