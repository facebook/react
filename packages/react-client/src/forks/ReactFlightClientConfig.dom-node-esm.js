/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This should really have a Node and a Browser fork but to avoid too many configs we limit this to build the same for both
export * from 'react-client/src/ReactFlightClientConfigBrowser';
export * from 'react-server-dom-esm/src/ReactFlightClientConfigESMBundler';
export * from 'react-dom-bindings/src/shared/ReactFlightClientConfigDOM';
