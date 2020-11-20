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

let warnedAboutConditionsFlag = false;

export async function resolve(
  specifier: string,
  context: ResolveContext,
  defaultResolve: ResolveFunction,
): Promise<string> {
  if (!context.conditions.includes('react-server')) {
    context = {
      ...context,
      conditions: [...context.conditions, 'react-server'],
    };
    if (!warnedAboutConditionsFlag) {
      warnedAboutConditionsFlag = true;
      // eslint-disable-next-line react-internal/no-production-logging
      console.warn(
        'You did not run Node.js with the `--conditions react-server` flag. ' +
          'Any "react-server" override will only work with ESM imports.',
      );
    }
  }
  // We intentionally check the specifier here instead of the resolved file.
  // This allows package exports to configure non-server aliases that resolve to server files
  // depending on environment. It's probably a bad idea to export a server file as "main" though.
  if (specifier.endsWith('.server.js')) {
    if (context.parentURL && !context.parentURL.endsWith('.server.js')) {
      throw new Error(
        `Cannot import "${specifier}" from "${context.parentURL}". ` +
          'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
          'That way nobody accidentally sends these to the client by indirectly importing it.',
      );
    }
  }
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
