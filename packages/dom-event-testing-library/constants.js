/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

export const defaultPointerId = 1;
export const defaultPointerSize = 23;
export const defaultBrowserChromeSize = 50;

/**
 * Button property
 * This property only guarantees to indicate which buttons are pressed during events caused by pressing or
 * releasing one or multiple buttons. As such, it is not reliable for events such as 'mouseenter', 'mouseleave',
 * 'mouseover', 'mouseout' or 'mousemove'. Furthermore, the semantics differ for PointerEvent, where the value
 * for 'pointermove' will always be -1.
 */

export const buttonType = {
  // no change since last event
  none: -1,
  // left-mouse
  // touch contact
  // pen contact
  primary: 0,
  // right-mouse
  // pen barrel button
  secondary: 2,
  // middle mouse
  auxiliary: 1,
  // back mouse
  back: 3,
  // forward mouse
  forward: 4,
  // pen eraser
  eraser: 5,
};

/**
 * Buttons bitmask
 */

export const buttonsType = {
  none: 0,
  // left-mouse
  // touch contact
  // pen contact
  primary: 1,
  // right-mouse
  // pen barrel button
  secondary: 2,
  // middle mouse
  auxiliary: 4,
  // back mouse
  back: 8,
  // forward mouse
  forward: 16,
  // pen eraser
  eraser: 32,
};
