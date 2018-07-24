/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function getActiveElement(doc?: ?Document): Element {
  doc = doc || document;
  // To account for edge cases in which document.body could be null
  const body = doc.body || doc.createElement('body');
  try {
    return doc.activeElement || body;
  } catch (e) {
    return body;
  }
}
