/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function delay() {
  let now = performance.now();
  while (performance.now() - now < 16) {
    // Artificial delay -- do nothing for 100ms
  }
}
export default function getFiltered(todos, visibility) {
  //delay()
  // This only works when there is only one counter unfortunately...
  const $filterCountBadge = document.querySelector(".FilterCountBanner .badge");
  if ($filterCountBadge)
    $filterCountBadge.textContent = parseInt($filterCountBadge.textContent) + 1;
  switch (visibility) {
    case "all":
      return todos;
    case "active":
      return todos.filter(t => !t.done);
    case "completed":
      return todos.filter(t => t.done);
  }
}
