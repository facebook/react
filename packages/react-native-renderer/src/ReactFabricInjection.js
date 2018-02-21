/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import './ReactNativeInjectionShared';

// TODO: The event emitter registration is interfering with the existing
// ReactNative renderer. So disable it for Fabric for now.

// import * as ReactNativeEventEmitter from './ReactNativeEventEmitter';

// Module provided by RN:
// import RCTEventEmitter from 'RCTEventEmitter';

/**
 * Register the event emitter with the native bridge
 */
// RCTEventEmitter.register(ReactNativeEventEmitter);
