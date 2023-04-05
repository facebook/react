/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Update an array in an immutable manner.
export default function getUpdated(todos, newTodo) {
  return todos
    .map(t => {
      if (t.id === newTodo.id) {
        return newTodo;
      } else {
        return t;
      }
    })
    .filter(t => !!t.text);
}
