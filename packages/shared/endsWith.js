/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function endsWith(subject: string, search: string): boolean {
  const length = subject.length;
  return subject.substring(length - search.length, length) === search;
}
