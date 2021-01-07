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
  siftUp(heap, index);
}

export function peek(heap: Heap): Node | null {
  if (heap.length === 0) return null;
  return heap[0];
}

export function pop(heap: Heap): Node | null {
  if (heap.length === 0) return null;
  if (heap.length === 1) return heap.pop();

  const first = heap[0];
  heap[0] = heap.pop();
  siftDown(heap, 0);
  return first;
}

function siftUp(heap, i) {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const minIndex = smaller(heap, index, parentIndex);

    // The parent is smaller. Exit.
    if (minIndex === parentIndex) return;

    swap(heap, index, parentIndex);
    index = parentIndex;
  }
}

function siftDown(heap, i) {
  let index = i;
  const length = heap.length;
  while (index < length) {
    const leftIndex = index * 2 + 1;
    const rightIndex = leftIndex + 1;

    // Get index of the smallest node among current and its child(ren).
    let minIndex = index;
    if (rightIndex < length) {
      // As a heap is a complete binary tree, node with right child must have the left one.
      minIndex = smaller(heap, minIndex, smaller(heap, leftIndex, rightIndex));
    } else if (leftIndex < length) {
      minIndex = smaller(heap, minIndex, leftIndex);
    }

    // Neither child is smaller. Exit.
    if (minIndex === index) return;

    swap(heap, index, minIndex);
    index = minIndex;
  }
}

function compare(a, b) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

function smaller(heap, i, j) {
  return compare(heap[i], heap[j]) < 0 ? i : j;
}

function swap(heap, i, j) {
  const temp = heap[i];
  heap[i] = heap[j];
  heap[j] = temp;
}
