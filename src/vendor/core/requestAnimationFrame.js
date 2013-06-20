/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule requestAnimationFrame
 */

var emptyFunction = require('emptyFunction');

var requestAnimationFrame =
  window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function(callback) {
    // Browsers which don't support requestAnimationFrame are likely running on
    // older hardware, so it's not reasonable to expect 60FPS animations out of
    // them. 30FPS (33.3ms per frame) is more reasonable.
    return window.setTimeout(callback, 33);
  };

// Works around a rare bug in Safari 6 where the first request is never invoked.
requestAnimationFrame(emptyFunction);

module.exports = requestAnimationFrame;
