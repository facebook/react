/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {pathToFileURL, URL} from 'url';

// Compatible with Bun which implements the `url` module.
export function getSourceURL(stackFilename: string): string {
  const leadingURLProtocol = /^\w+:\/\//;
  if (!leadingURLProtocol.test(stackFilename)) {
    // Node.js will key absolute file paths like this in their sourcemap cache.
    try {
      // This will throw on invalid paths.
      return pathToFileURL(stackFilename).href;
    } catch {}
  } else {
    try {
      // avoid over-encoding if the stackFilename is already a valid URL.
      return new URL(stackFilename).toString();
    } catch {}
  }
  return encodeURI(stackFilename);
}
