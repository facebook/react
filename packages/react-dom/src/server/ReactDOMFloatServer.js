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

type CrossOrigin = 'anonymous' | 'use-credentials';
type MimeType = string;

type ResourceMeta = {flushed: boolean, replaced: boolean};
type ResourceBase = {
  ...ResourceMeta,
  priority: Priority,
  module: boolean,
  href: string,
  as: '',
  type: '',
  crossorigin: '',
};
type IndeterminantResource = ResourceBase;
type ScriptResource = {...ResourceBase, as: 'script'};
type StyleResource = {...ResourceBase, as: 'style'};
type ImageResource = {...ResourceBase, as: 'image'};
type VideoResource = {...ResourceBase, as: 'video'};
type AudioResource = {...ResourceBase, as: 'audio'};
type TrackResource = {...ResourceBase, as: 'track'};
type FontResource = {
  ...ResourceBase,
  as: 'font',
  type: MimeType,
  crossorigin: 'anonymous',
};
type FetchResource = {...ResourceBase, as: 'fetch'};

export type Resource =
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

export const DNS_PREFETCH = 0;
export const PRECONNECT = 1;
export const PREFETCH = 2;
export const PRELOAD = 3;
export const PREINIT = 4;

type Priority = 0 | 1 | 2 | 3 | 4;

type PreloadAs = 'style' | 'font';
type PreloadOptions = {as?: PreloadAs};
function preload(href: string, options?: PreloadOptions) {
  if (currentResourceMap === null) {
    throw new Error(
      'preload was called while currentResourceMap is null. this is a bug in React',
    );
  }
  console.log('currentResourceMap', currentResourceMap);
  const as = options && typeof options.as === 'string' ? options.as : '';
  let key = href;
  if (currentResourceMap.has(key)) {
    console.log(key, 'already scheduled to be preloaded');
    return;
  }
  const resource: Resource = {
    priority: PRELOAD,
    DEV_actionName: 'preload',
    flushed: false,
    module: false,
    href,
    as,
    type: '',
  };
  currentResourceMap.set(key, resource);
  console.log('on server: preload', href);
}

type PreinitAs = 'style' | 'font';
type PreinitOptions = {as?: PreinitAs};
function preinit(href: String, options?: PreinitOptions) {
  if (currentResourceMap === null) {
    throw new Error(
      'preinit was called while currentResourceMap is null. this is a bug in React',
    );
  }
  const as = options && typeof options.as === 'string' ? options.as : '';
  let key = href;
  let currentResource = currentResourceMap.get(key);
  if (currentResource) {
    if (currentResource.priority >= PREINIT) {
      return;
    } else {
      currentResource.priority = PREINIT;
      currentResource.DEV_actionName = 'preinit';
      currentResource.flushed = false;
    }
  } else {
    const resource: Resource = {
      priority: PREINIT,
      DEV_actionName: 'preinit',
      flushed: false,
      module: false,
      href,
      as,
      type: '',
    };
    currentResourceMap.set(key, resource);
    console.log('on server: preinit', href);
  }
}

const Dispatcher = {
  preload,
  preinit,
};
