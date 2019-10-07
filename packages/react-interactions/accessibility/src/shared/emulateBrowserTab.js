/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'react-interactions/events/src/dom/testing-library';

// This function is used by the a11y modules for testing
export function emulateBrowserTab(backwards: boolean): void {
  const activeElement = document.activeElement;
  const focusedElem = createEventTarget(activeElement);
  let defaultPrevented = false;
  focusedElem.keydown({
    key: 'Tab',
    shiftKey: backwards,
    preventDefault() {
      defaultPrevented = true;
    },
  });
  if (!defaultPrevented) {
    // This is not a full spec compliant version, but should be suffice for this test
    const focusableElems = Array.from(
      document.querySelectorAll(
        'input, button, select, textarea, a[href], [tabindex], [contenteditable], iframe, object, embed',
      ),
    ).filter(elem => elem.tabIndex > -1 && !elem.disabled);
    const idx = focusableElems.indexOf(activeElement);
    if (idx !== -1) {
      focusableElems[backwards ? idx - 1 : idx + 1].focus();
    }
  }
}
