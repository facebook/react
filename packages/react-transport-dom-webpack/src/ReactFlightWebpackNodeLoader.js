/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type ResolveContext = {
  conditions: Array<string>,
  parentURL: string | void,
};

type ResolveFunction = (
  string,
  ResolveContext,
  ResolveFunction,
) => Promise<string>;

type GetSourceContext = {
  format: string,
  url: string,
};

type GetSourceFunction = (
  string,
  GetSourceContext,
  GetSourceFunction,
) => Promise<{source: Source}>;

type Source = string | ArrayBuffer | Uint8Array;

export async function resolve(
  specifier: string,
  context: ResolveContext,
  defaultResolve: ResolveFunction,
): Promise<string> {
  // TODO: Resolve server-only files.
  return defaultResolve(specifier, context, defaultResolve);
}

export async function getSource(
  url: string,
  context: GetSourceContext,
  defaultGetSource: GetSourceFunction,
): Promise<{source: Source}> {
  if (url.endsWith('.client.js')) {
    // TODO: Named exports.
    const src =
      "export default { $$typeof: Symbol.for('react.module.reference'), name: " +
      JSON.stringify(url) +
      '}';
    return {source: src};
  }
  return defaultGetSource(url, context, defaultGetSource);
}
