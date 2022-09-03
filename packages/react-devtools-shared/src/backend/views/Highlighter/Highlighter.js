/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Agent from 'react-devtools-shared/src/backend/agent';

import Overlay from './Overlay';

const SHOW_DURATION = 2000;

let timeoutID: TimeoutID | null = null;
let overlay: Overlay | null = null;

export function hideOverlay(agent: Agent) {
  if (window.document == null) {
    agent.emit('hideNativeHighlight');
    return;
  }
  timeoutID = null;

  if (overlay !== null) {
    overlay.remove();
    overlay = null;
  }
}

export function showOverlay(
  elements: Array<HTMLElement> | null,
  componentName: string | null,
  agent: Agent,
  hideAfterTimeout: boolean,
) {
  if (window.document == null) {
    if (elements != null && elements[0] != null) {
      agent.emit('showNativeHighlight', elements[0]);
    }
    return;
  }

  if (timeoutID !== null) {
    clearTimeout(timeoutID);
  }

  if (elements == null) {
    return;
  }

  if (overlay === null) {
    overlay = new Overlay(agent);
  }

  overlay.inspect(elements, componentName);

  if (hideAfterTimeout) {
    timeoutID = setTimeout(() => hideOverlay(agent), SHOW_DURATION);
  }
}
