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
}
