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
  | number
  | boolean
  | null
  | {[key: string]: JSONValue}
  | Array<JSONValue>;

type Thenable = {
  then(resolve: () => mixed, reject: (error: Error) => mixed): mixed,
  ...
};

declare module 'ReactFlightDOMRelayServerIntegration' {
  declare export opaque type Destination;
  declare export function emitModel(
    destination: Destination,
    id: number,
    json: JSONValue,
  ): void;
  declare export function emitError(
    destination: Destination,
    id: number,
    message: string,
    stack: string,
  ): void;
  declare export function close(destination: Destination): void;

  declare export opaque type ModuleReference;
  declare export opaque type ModuleMetaData;
  declare export function resolveModuleMetaData(
    resourceReference: ModuleReference,
  ): ModuleMetaData;
}

declare module 'ReactFlightDOMRelayClientIntegration' {
  declare export opaque type ModuleReference;
  declare export opaque type ModuleMetaData;
  declare export function resolveModuleReference<T>(
    moduleData: ModuleMetaData,
  ): ModuleReference<T>;
  declare export function preloadModule<T>(
    moduleReference: ModuleReference<T>,
  ): void;
  declare export function loadModule<T>(
    moduleReference: ModuleReference<T>,
  ): null | Thenable;
  declare export function requireModule<T>(
    moduleReference: ModuleReference<T>,
  ): T;
}
