/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Converts a topLevelType (e.g., "topPress") to a DOM event name (e.g., "press").
 * Strips the "top" prefix and lowercases the result.
 */
export function topLevelTypeToEventName(topLevelType: string): string {
  const fourthChar = topLevelType.charCodeAt(3);
  if (
    topLevelType.startsWith('top') &&
    fourthChar >= 65 /* A */ &&
    fourthChar <= 90 /* Z */
  ) {
    return topLevelType.slice(3).toLowerCase();
  }
  return topLevelType;
}
