/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

export type SSRManifest = string; // Module root path

export type ServerManifest = string; // Module root path

export type ServerReferenceId = string;

export opaque type ClientReferenceMetadata = string;

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  specifier: string,
  name: string,
};

export function resolveClientReference<T>(
  bundlerConfig: SSRManifest,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  const [specifier, name] = metadata.split('#');
  return {
    specifier,
    name,
  };
}

export function resolveServerReference<T>(
  config: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  const [specifier, name] = id.split('#');
  return {
    specifier,
    name,
  };
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  return __vite_preload__(metadata);
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  return __vite_require__(metadata);
}
