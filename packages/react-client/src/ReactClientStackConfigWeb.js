/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function getSourceURL(stackFilename: string): string {
  if (stackFilename.startsWith('/')) {
    // If the filename starts with `/` we assume that it is a file system file
    // rather than relative to the current host. Since on the server fully qualified
    // stack traces use the file path.
    // TODO: What does this look like on Windows?
    try {
      return new URL('file://' + stackFilename).toString();
    } catch {}
  } else {
    try {
      // avoid over-encoding if the stackFilename is already a valid URL.
      return new URL(stackFilename).toString();
    } catch {}
  }
  return encodeURI(stackFilename);
}
