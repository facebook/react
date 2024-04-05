/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CrossOriginString} from 'react-dom-bindings/src/shared/crossOriginStrings';

export type PrefetchDNSOptions = {};
export type PreconnectOptions = {crossOrigin?: string};
export type PreloadOptions = {
  as: string,
  crossOrigin?: string,
  integrity?: string,
  type?: string,
  media?: string,
  nonce?: string,
  fetchPriority?: FetchPriorityEnum,
  imageSrcSet?: string,
  imageSizes?: string,
  referrerPolicy?: string,
};
export type PreloadModuleOptions = {
  as?: string,
  crossOrigin?: string,
  integrity?: string,
  nonce?: string,
};
export type PreinitOptions = {
  as: string,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
  nonce?: string,
  fetchPriority?: FetchPriorityEnum,
};
export type PreinitModuleOptions = {
  as?: string,
  crossOrigin?: string,
  integrity?: string,
  nonce?: string,
};

export type CrossOriginEnum = '' | 'use-credentials' | CrossOriginString;
export type FetchPriorityEnum = 'high' | 'low' | 'auto';

export type PreloadImplOptions = {
  crossOrigin?: ?CrossOriginEnum,
  integrity?: ?string,
  nonce?: ?string,
  type?: ?string,
  fetchPriority?: ?string,
  referrerPolicy?: ?string,
  imageSrcSet?: ?string,
  imageSizes?: ?string,
  media?: ?string,
};
export type PreloadModuleImplOptions = {
  as?: ?string,
  crossOrigin?: ?CrossOriginEnum,
  integrity?: ?string,
  nonce?: ?string,
};
export type PreinitStyleOptions = {
  crossOrigin?: ?CrossOriginEnum,
  integrity?: ?string,
  fetchPriority?: ?string,
};
export type PreinitScriptOptions = {
  crossOrigin?: ?CrossOriginEnum,
  integrity?: ?string,
  fetchPriority?: ?string,
  nonce?: ?string,
};
export type PreinitModuleScriptOptions = {
  crossOrigin?: ?CrossOriginEnum,
  integrity?: ?string,
  nonce?: ?string,
};

export type HostDispatcher = {
  flushSyncWork: () => boolean | void,
  prefetchDNS: (href: string) => void,
  preconnect: (href: string, crossOrigin?: ?CrossOriginEnum) => void,
  preload: (href: string, as: string, options?: ?PreloadImplOptions) => void,
  preloadModule: (href: string, options?: ?PreloadModuleImplOptions) => void,
  preinitStyle: (
    href: string,
    precedence: ?string,
    options?: ?PreinitStyleOptions,
  ) => void,
  preinitScript: (src: string, options?: ?PreinitScriptOptions) => void,
  preinitModuleScript: (
    src: string,
    options?: ?PreinitModuleScriptOptions,
  ) => void,
};

export type ImportMap = {
  imports?: {
    [specifier: string]: string,
  },
  scopes?: {
    [scope: string]: {
      [specifier: string]: string,
    },
  },
};
