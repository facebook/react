/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export async function fetchState() {
  const res = await fetch('/api/state');
  return res.json();
}

export async function saveState(state) {
  await fetch('/api/state', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(state),
  });
}
