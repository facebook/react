/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type JSONValue =
  | string
  | boolean
  | number
  | null
  | {+[key: string]: JSONValue}
  | $ReadOnlyArray<JSONValue>;

declare module 'JSResourceReference' {
  declare export interface JSResourceReference<T> {
    getModuleId(): string;
    getModuleIdAsRef(): $Flow$ModuleRef<T>;
    getModuleIfRequired(): ?T;
    load(): Promise<T>;
    preload(): void;
  }
}

declare module 'JSResourceReferenceImpl' {
  declare export default class JSResourceReferenceImpl<T> {
    getModuleId(): string;
    getModuleIdAsRef(): $Flow$ModuleRef<T>;
    getModuleIfRequired(): ?T;
    load(): Promise<T>;
    preload(): void;
  }
}

declare module 'ReactFlightDOMRelayServerIntegration' {
  import type {JSResourceReference} from 'JSResourceReference';

  declare export opaque type Destination;
  declare export opaque type BundlerConfig;
  declare export function emitRow(
    destination: Destination,
    json: JSONValue,
  ): void;
  declare export function close(destination: Destination): void;

  declare export type ModuleMetaData = JSONValue;
  declare export function resolveModuleMetaData<T>(
    config: BundlerConfig,
    resourceReference: JSResourceReference<T>,
  ): ModuleMetaData;
}

declare module 'ReactFlightDOMRelayClientIntegration' {
  import type {JSResourceReference} from 'JSResourceReference';

  declare export opaque type ModuleMetaData;
  declare export function resolveModuleReference<T>(
    moduleData: ModuleMetaData,
  ): JSResourceReference<T>;
  declare export function preloadModule<T>(
    moduleReference: JSResourceReference<T>,
  ): void;
  declare export function requireModule<T>(
    moduleReference: JSResourceReference<T>,
  ): T;
}

declare module 'ReactFlightNativeRelayServerIntegration' {
  import type {JSResourceReference} from 'JSResourceReference';

  declare export opaque type Destination;
  declare export opaque type BundlerConfig;
  declare export function emitRow(
    destination: Destination,
    json: JSONValue,
  ): void;
  declare export function close(destination: Destination): void;

  declare export type ModuleMetaData = JSONValue;
  declare export function resolveModuleMetaData<T>(
    config: BundlerConfig,
    resourceReference: JSResourceReference<T>,
  ): ModuleMetaData;
}

declare module 'ReactFlightNativeRelayClientIntegration' {
  import type {JSResourceReference} from 'JSResourceReference';

  declare export opaque type ModuleMetaData;
  declare export function resolveModuleReference<T>(
    moduleData: ModuleMetaData,
  ): JSResourceReference<T>;
  declare export function preloadModule<T>(
    moduleReference: JSResourceReference<T>,
  ): void;
  declare export function requireModule<T>(
    moduleReference: JSResourceReference<T>,
  ): T;
}
