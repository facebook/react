/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let ENABLED: boolean = false;

export function toggleLogging(enabled: boolean) {
  ENABLED = enabled;
}

export function log(fn: () => string) {
  if (ENABLED) {
    const message = fn();
    process.stdout.write(message.trim() + "\n\n");
  }
}
