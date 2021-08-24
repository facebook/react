/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useLayoutEffect, useRef} from 'react';

const TOOLTIP_OFFSET_BOTTOM = 10;
const TOOLTIP_OFFSET_TOP = 5;

export default function useSmartTooltip({
  canvasRef,
  mouseX,
  mouseY,
}: {
  canvasRef: {|current: HTMLCanvasElement | null|},
  mouseX: number,
  mouseY: number,
}) {
  const ref = useRef<HTMLElement | null>(null);

  // HACK: Browser extension reports window.innerHeight of 0,
  // so we fallback to using the tooltip target element.
  let height = window.innerHeight;
  let width = window.innerWidth;
  const target = canvasRef.current;
  if (target !== null) {
    const rect = target.getBoundingClientRect();
    height = rect.top + rect.height;
    width = rect.left + rect.width;
  }

  useLayoutEffect(() => {
    const element = ref.current;
    if (element !== null) {
      // Let's check the vertical position.
      if (mouseY + TOOLTIP_OFFSET_BOTTOM + element.offsetHeight >= height) {
        // The tooltip doesn't fit below the mouse cursor (which is our
        // default strategy). Therefore we try to position it either above the
        // mouse cursor or finally aligned with the window's top edge.
        if (mouseY - TOOLTIP_OFFSET_TOP - element.offsetHeight > 0) {
          // We position the tooltip above the mouse cursor if it fits there.
          element.style.top = `${mouseY -
            element.offsetHeight -
            TOOLTIP_OFFSET_TOP}px`;
        } else {
          // Otherwise we align the tooltip with the window's top edge.
          element.style.top = '0px';
        }
      } else {
        element.style.top = `${mouseY + TOOLTIP_OFFSET_BOTTOM}px`;
      }

      // Now let's check the horizontal position.
      if (mouseX + TOOLTIP_OFFSET_BOTTOM + element.offsetWidth >= width) {
        // The tooltip doesn't fit at the right of the mouse cursor (which is
        // our default strategy). Therefore we try to position it either at the
        // left of the mouse cursor or finally aligned with the window's left
        // edge.
        if (mouseX - TOOLTIP_OFFSET_TOP - element.offsetWidth > 0) {
          // We position the tooltip at the left of the mouse cursor if it fits
          // there.
          element.style.left = `${mouseX -
            element.offsetWidth -
            TOOLTIP_OFFSET_TOP}px`;
        } else {
          // Otherwise, align the tooltip with the window's left edge.
          element.style.left = '0px';
        }
      } else {
        element.style.left = `${mouseX + TOOLTIP_OFFSET_BOTTOM}px`;
      }
    }
  });

  return ref;
}
