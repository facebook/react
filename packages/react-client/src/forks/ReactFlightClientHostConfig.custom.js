/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a host config that's used for the `react-server` package on npm.
// It is only used by third-party renderers.
//
// Its API lets you pass the host config as an argument.
// However, inside the `react-server` we treat host config as a module.
// This file is a shim between two worlds.
//
// It works because the `react-server` bundle is wrapped in something like:
//
// module.exports = function ($$$config) {
//   /* renderer code */
// }
//
// So `$$$config` looks like a global variable, but it's
// really an argument to a top-level wrapping function.

declare var $$$hostConfig: any;

export type Response = any;
export opaque type BundlerConfig = mixed; // eslint-disable-line no-undef
export opaque type ModuleMetaData = mixed; // eslint-disable-line no-undef
export opaque type ModuleReference<T> = mixed; // eslint-disable-line no-undef
export const resolveModuleReference = $$$hostConfig.resolveModuleReference;
export const preloadModule = $$$hostConfig.preloadModule;
export const requireModule = $$$hostConfig.requireModule;

export opaque type Source = mixed; // eslint-disable-line no-undef

export type UninitializedModel = string;
export const parseModel = $$$hostConfig.parseModel;

export opaque type StringDecoder = mixed; // eslint-disable-line no-undef

export const supportsBinaryStreams = $$$hostConfig.supportsBinaryStreams;
export const createStringDecoder = $$$hostConfig.createStringDecoder;
export const readPartialStringChunk = $$$hostConfig.readPartialStringChunk;
export const readFinalStringChunk = $$$hostConfig.readFinalStringChunk;
