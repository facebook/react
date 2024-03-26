/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This module is forked in different environments.
// By default, return `true` to log errors to the console.
// Forks can return `false` if this isn't desirable.

export function showErrorDialog(
  errorBoundary: ?React$Component<any, any>,
  error: mixed,
  componentStack: string,
): boolean {
  return true;
}
