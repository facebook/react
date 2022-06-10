/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type PreloadAs = 'style';
type PreloadOptions = {as?: PreloadAs, signal: AbortSignal};
function preload(href: string, options?: PreloadOptions) {
  console.log('on server: preload', href);
}

const Dispatcher = {
  preload,
};

export {Dispatcher};
