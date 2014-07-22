/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule getEventAltGraphKey
 * @typechecks static-only
 */

"use strict";

function getEventAltGraphKey(nativeEvent) {
  if ('altGraphKey' in nativeEvent) {
    return nativeEvent['altGraphKey'];
  }
  // IE9 (and more perhaps) does not expose altGraphKey, but supports it via
  // getModifierState. Chrome exposes altGraphKey but doesn't actually support
  // it, OSX/PC inconsistencies makes it seemingly quite useless at current.
  return (
    'getModifierState' in nativeEvent &&
    nativeEvent.getModifierState('AltGraph')
  );
}

module.exports = getEventAltGraphKey;
