/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {InjectedDeviceStorageMethods} from 'react-devtools-shared/src/backend/types';

export {initializeFromDeviceStorage} from './initialize';
import {initializeFromDeviceStorage} from './initialize';

// # How does React Native/React access settings during startup, potentially
// before the DevTools frontend has connected?
//
// During startup,
// - React Native reads those settings from device storage and writes them to
//   the window object.
// - React does need to do this, as the DevTools extension (if installed) can
//   execute code that runs before the site JS. This code reads these settings
//   from the localStorage of the extension frontend and adds a <script /> tag
//   that writes these settings to the window object.
//
// # When does RN/React attempt to access these settings?
//
// - When ReactDOM is required
// - In RN, when `injectDeviceStorageMethods` is called, which is during the same
//   tick as the app initially renders, and
// - When the DevTools backend connects
//
// So, that means that `initializeFromDeviceStorage` should be safe to be called
// multiple times.

let methods: ?InjectedDeviceStorageMethods = null;

type EncounteredSettings = {[string]: string};
let mostRecentlyEncounteredSettings: ?EncounteredSettings = null;

// This function is called by React Native before the main app is loaded, as
// `window.__REACT_DEVTOOLS_GLOBAL_HOOK__.injectDeviceStorageMethods`. This is
// before the React DevTools frontend will have connected.
//
// The provided `setValueOnDevice` method allows us to cache most-recently-seen
// settings (e.g. whether to hide double console logs in strict mode).
//
// This behaves as follows:
// - when `injectDeviceStorageMethods` is first called, if the React DevTools
//   frontend has connected, this caches on device any settings stored in (A)
// - when the React DevTools frontend connects and whenever a relevant setting
//   is modified, `storeSettingInDeviceStorage` is (repeatedly) called.
//   - if `injectDeviceStorageMethods` has been called, this will persist the
//     relevant setting to device storage
//   - if `injectDeviceStorageMethods` has not been called, this will store the
//     the settings in memory (step A)
//
// Values stored via `setValueOnDevice` (i.e. in device storage) should not be
// copied to React DevTools' local storage.
export function injectDeviceStorageMethods(
  injectedMethods: InjectedDeviceStorageMethods,
) {
  // This is a no-op if called multiple times.
  if (methods != null) {
    return;
  }
  methods = injectedMethods;

  if (mostRecentlyEncounteredSettings != null) {
    // The DevTools front-end has connected and attempted to cache some
    // settings. Let's cache them on device storage.
    for (const key in mostRecentlyEncounteredSettings) {
      const value = mostRecentlyEncounteredSettings[key];
      try {
        injectedMethods.setValueOnDevice(key, value);
      } catch {}
    }
    mostRecentlyEncounteredSettings = null;
  }

  initializeFromDeviceStorage();
}

export function storeSettingInDeviceStorage(key: string, value: string) {
  if (methods == null) {
    // injectDeviceStorageMethods has not been called
    mostRecentlyEncounteredSettings = mostRecentlyEncounteredSettings ?? {};
    mostRecentlyEncounteredSettings[key] = value;
  } else {
    // injectDeviceStorageMethods has been called
    try {
      methods.setValueOnDevice(key, value);
    } catch {}
  }
}
