/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {pushDispatcher, popDispatcher} from 'react-dom/ReactDOMDispatcher';

let currentResponseState = null;
let currentResourceMap = null;

type LoadAction = 'preload';

type CrossOrigin = 'anonymous' | 'use-credentials';

type ResourceMeta = {flushed: boolean, replaced: boolean};
type ResourceBase = {
  ...ResourceMeta,
  loadAction: LoadAction,
  href: string,
  as: '',
  type: '',
};
type IndeterminantResource = ResourceBase;
type StyleResource = {...ResourceBase, as: 'style'};
type FontResource = {...ResourceBase, as: 'font', type: string};
type FetchResource = {...ResourceBase, as: 'fetch'};

type Resource =
  | IndeterminantResource
  | StyleResource
  | FontResource
  | FetchResource;
export type ResourceMap = Map<string, Resource>;

// @TODO deal with reentrancy
export function prepareToRender(resourceMap: ResourceMap) {
  console.log('prepareToRender FloatServer', resourceMap);
  currentResourceMap = resourceMap;

  pushDispatcher(Dispatcher);
}

export function cleanupAfterRender() {
  currentResourceMap = null;

  popDispatcher();
}

type PreloadAs = 'style' | 'font';
type PreloadOptions = {as?: PreloadAs};
function preload(href: string, options?: PreloadOptions) {
  if (currentResourceMap === null) {
    throw new Error(
      'preload was called while currentResourceMap is null. this is a bug in React',
    );
  }
  const as = options && typeof options.as === 'string' ? options.as : '';
  let key = `preload${as}->${href}`;
  if (currentResourceMap.has(key)) {
    console.log(key, 'already scheduled to be preloaded');
    return;
  }
  let resource: Resource = {
    flushed: false,
    replaced: false,
    loadAction: 'preload',
    href,
    as,
    type: '',
  };
  currentResourceMap.set(key, resource);
  console.log('on server: preload', href);
}

const Dispatcher = {
  preload,
};
