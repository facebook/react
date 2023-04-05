/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function getUpdated(tasks, newTodo) {
  return tasks
    .map(t => {
      if (t.id === newTodo.id) {
        return newTodo;
      } else {
        return t;
      }
    })
    .filter(t => !!t.text);
}
