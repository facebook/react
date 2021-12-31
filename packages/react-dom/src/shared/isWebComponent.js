/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function isWebComponent(tag) {
  if (tag && global.customElements) {
    return !!global.customElements.get(tag);
  }
  return false;
}
