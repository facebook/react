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
  element: HTMLElement | null,
  componentName: string | null,
  isSticky: boolean
) {
  if (timeoutID !== null) {
    clearTimeout(timeoutID);
  }

  if (element == null) {
    return;
  }

  if (overlay === null) {
    overlay = new Overlay();
  }

  overlay.inspect(element, componentName);

  if (!isSticky) {
    timeoutID = setTimeout(hideOverlay, SHOW_DURATION);
  }
}
