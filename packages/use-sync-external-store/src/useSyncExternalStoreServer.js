/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';

export function useSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
): T {
  if (getServerSnapshot === undefined) {
    invariant(
      false,
      'Missing getServerSnapshot, which is required for server-' +
        'rendered content.',
    );
  }
  return getServerSnapshot();
}
