/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {pushDispatcher, popDispatcher} from 'react-dom/ReactDOMDispatcher';

export function prepareToRender() {
  pushDispatcher(Dispatcher);
}

export function cleanupAfterRender() {
  popDispatcher();
}

type PreloadAs = 'style';
type PreloadOptions = {as?: PreloadAs, signal: AbortSignal};
function preload(href: string, options?: PreloadOptions) {
  console.log('on client: preload', href);
}

const Dispatcher = {
  preload,
};
