/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const ReactNativeEventPluginOrder = [
  'ReactNativeEventTelemetryPlugin', // We want telemetry to get a chance to run before any real work is done.
  'ResponderEventPlugin',
  'ReactNativeBridgeEventPlugin',
];

export default ReactNativeEventPluginOrder;
