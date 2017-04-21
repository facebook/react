/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule takeSnapshot
 * @flow
 */
'use strict';

var ReactNative = require('ReactNative');
var UIManager = require('UIManager');

import type {Element} from 'React';

/**
 * Capture an image of the screen, window or an individual view. The image
 * will be stored in a temporary file that will only exist for as long as the
 * app is running.
 *
 * The `view` argument can be the literal string `window` if you want to
 * capture the entire window, or it can be a reference to a specific
 * React Native component.
 *
 * The `options` argument may include:
 * - width/height (number) - the width and height of the image to capture.
 * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
 * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
 *
 * Returns a Promise.
 * @platform ios
 */
function takeSnapshot(
  view?: 'window' | Element<any> | number,
  options?: {
    width?: number,
    height?: number,
    format?: 'png' | 'jpeg',
    quality?: number,
  },
): Promise<any> {
  if (typeof view !== 'number' && view !== 'window') {
    view = ReactNative.findNodeHandle(view) || 'window';
  }

  // Call the hidden '__takeSnapshot' method; the main one throws an error to
  // prevent accidental backwards-incompatible usage.
  return UIManager.__takeSnapshot(view, options);
}

module.exports = takeSnapshot;
