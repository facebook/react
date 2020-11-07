/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Overlay from './Overlay';

const SHOW_DURATION = 2000;

let timeoutID: TimeoutID | null = null;
let overlay: Overlay | null = null;

export function hideOverlay() {
  timeoutID = null;

  if (overlay !== null) {
    overlay.remove();
    overlay = null;
  }
}

export function showOverlay(
  elements: Array<HTMLElement> | null,
  componentName: string | null,
  hideAfterTimeout: boolean,
) {
  // TODO (npm-packages) Detect RN and support it somehow
  if (window.document == null) {
    return;
  }

  if (timeoutID !== null) {
    clearTimeout(timeoutID);
  }

  if (elements == null) {
    return;
  }

  if (overlay === null) {
    overlay = new Overlay();
  }

  overlay.inspect(elements, componentName);

  if (hideAfterTimeout) {
    timeoutID = setTimeout(hideOverlay, SHOW_DURATION);
  }
}
