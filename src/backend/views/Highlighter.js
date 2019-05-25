// @flow

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
  hideAfterTimeout: boolean
) {
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
