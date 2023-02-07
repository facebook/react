/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as acorn from 'acorn';

type ResolveContext = {
  conditions: Array<string>,
  parentURL: string | void,
};

type ResolveFunction = (
  string,
  ResolveContext,
  ResolveFunction,
) => {url: string} | Promise<{url: string}>;

type GetSourceContext = {
  format: string,
};

type GetSourceFunction = (
  string,
  GetSourceContext,
  GetSourceFunction,
) => Promise<{source: Source}>;

type TransformSourceContext = {
  format: string,
  url: string,
};

type TransformSourceFunction = (
  Source,
  TransformSourceContext,
  TransformSourceFunction,
) => Promise<{source: Source}>;

type LoadContext = {
  conditions: Array<string>,
  format: string | null | void,
  importAssertions: Object,
};

type LoadFunction = (
  string,
  LoadContext,
  LoadFunction,
) => Promise<{format: string, shortCircuit?: boolean, source: Source}>;

type Source = string | ArrayBuffer | Uint8Array;

let warnedAboutConditionsFlag = false;

let stashedGetSource: null | GetSourceFunction = null;
let stashedResolve: null | ResolveFunction = null;

export async function resolve(
  specifier: string,
  context: ResolveContext,
  defaultResolve: ResolveFunction,
): Promise<{url: string}> {
  // We stash this in case we end up needing to resolve export * statements later.
  stashedResolve = defaultResolve;

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
  return await defaultResolve(specifier, context, defaultResolve);
}

export async function getSource(
  url: string,
  context: GetSourceContext,
  defaultGetSource: GetSourceFunction,
): Promise<{source: Source}> {
  // We stash this in case we end up needing to resolve export * statements later.
  stashedGetSource = defaultGetSource;
  return defaultGetSource(url, context, defaultGetSource);
}

function addExportNames(names: Array<string>, node: any) {
  switch (node.type) {
    case 'Identifier':
      names.push(node.name);
      return;
    case 'ObjectPattern':
      for (let i = 0; i < node.properties.length; i++)
        addExportNames(names, node.properties[i]);
      return;
    case 'ArrayPattern':
      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i];
        if (element) addExportNames(names, element);
      }
      return;
    case 'Property':
      addExportNames(names, node.value);
      return;
    case 'AssignmentPattern':
      addExportNames(names, node.left);
      return;
    case 'RestElement':
      addExportNames(names, node.argument);
      return;
    case 'ParenthesizedExpression':
      addExportNames(names, node.expression);
      return;
  }
}

function resolveClientImport(
  specifier: string,
  parentURL: string,
): {url: string} | Promise<{url: string}> {
  // Resolve an import specifier as if it was loaded by the client. This doesn't use
  // the overrides that this loader does but instead reverts to the default.
  // This resolution algorithm will not necessarily have the same configuration
  // as the actual client loader. It should mostly work and if it doesn't you can
  // always convert to explicit exported names instead.
  const conditions = ['node', 'import'];
  if (stashedResolve === null) {
    throw new Error(
      'Expected resolve to have been called before transformSource',
    );
  }
  return stashedResolve(specifier, {conditions, parentURL}, stashedResolve);
}

async function parseExportNamesInto(
  body: any,
  names: Array<string>,
  parentURL: string,
  loader: LoadFunction,
): Promise<void> {
  for (let i = 0; i < body.length; i++) {
    const node = body[i];
    switch (node.type) {
      case 'ExportAllDeclaration':
        if (node.exported) {
          addExportNames(names, node.exported);
          continue;
        } else {
          const {url} = await resolveClientImport(node.source.value, parentURL);
          const {source} = await loader(
            url,
            {format: 'module', conditions: [], importAssertions: {}},
            loader,
          );
          if (typeof source !== 'string') {
            throw new Error('Expected the transformed source to be a string.');
          }
          const {body: childBody} = acorn.parse(source, {
            ecmaVersion: '2019',
            sourceType: 'module',
          });
          await parseExportNamesInto(childBody, names, url, loader);
          continue;
        }
      case 'ExportDefaultDeclaration':
        names.push('default');
        continue;
      case 'ExportNamedDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'VariableDeclaration') {
            const declarations = node.declaration.declarations;
            for (let j = 0; j < declarations.length; j++) {
              addExportNames(names, declarations[j].id);
            }
          } else {
            addExportNames(names, node.declaration.id);
          }
        }
        if (node.specifiers) {
          const specifiers = node.specifiers;
          for (let j = 0; j < specifiers.length; j++) {
            addExportNames(names, specifiers[j].exported);
          }
        }
        continue;
    }
  }
}

async function transformClientModule(
  source: string,
  url: string,
  loader: LoadFunction,
): Promise<string> {
  const names: Array<string> = [];

  // Do a quick check for the exact string. If it doesn't exist, don't
  // bother parsing.
  if (source.indexOf('use client') === -1) {
    return source;
  }

  const {body} = acorn.parse(source, {
    ecmaVersion: '2019',
    sourceType: 'module',
  });

  let useClient = false;
  for (let i = 0; i < body.length; i++) {
    const node = body[i];
    if (node.type !== 'ExpressionStatement' || !node.directive) {
      break;
    }
    if (node.directive === 'use client') {
      useClient = true;
      break;
    }
  }

  if (!useClient) {
    return source;
  }

  await parseExportNamesInto(body, names, url, loader);

  let newSrc =
    "const CLIENT_REFERENCE = Symbol.for('react.client.reference');\n";
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name === 'default') {
      newSrc += 'export default ';
      newSrc += 'Object.defineProperties(function() {';
      newSrc +=
        'throw new Error(' +
        JSON.stringify(
          `Attempted to call the default export of ${url} from the server` +
            `but it's on the client. It's not possible to invoke a client function from ` +
            `the server, it can only be rendered as a Component or passed to props of a` +
            `Client Component.`,
        ) +
        ');';
    } else {
      newSrc += 'export const ' + name + ' = ';
      newSrc += 'Object.defineProperties(function() {';
      newSrc +=
        'throw new Error(' +
        JSON.stringify(
          `Attempted to call ${name}() from the server but ${name} is on the client. ` +
            `It's not possible to invoke a client function from the server, it can ` +
            `only be rendered as a Component or passed to props of a Client Component.`,
        ) +
        ');';
    }
    newSrc += '},{';
    newSrc += 'name: { value: ' + JSON.stringify(name) + '},';
    newSrc += '$$typeof: {value: CLIENT_REFERENCE},';
    newSrc += 'filepath: {value: ' + JSON.stringify(url) + '}';
    newSrc += '});\n';
  }
  return newSrc;
}

async function loadClientImport(
  url: string,
  defaultTransformSource: TransformSourceFunction,
): Promise<{format: string, shortCircuit?: boolean, source: Source}> {
  if (stashedGetSource === null) {
    throw new Error(
      'Expected getSource to have been called before transformSource',
    );
  }
  // TODO: Validate that this is another module by calling getFormat.
  const {source} = await stashedGetSource(
    url,
    {format: 'module'},
    stashedGetSource,
  );
  const result = await defaultTransformSource(
    source,
    {format: 'module', url},
    defaultTransformSource,
  );
  return {format: 'module', source: result.source};
}

export async function transformSource(
  source: Source,
  context: TransformSourceContext,
  defaultTransformSource: TransformSourceFunction,
): Promise<{source: Source}> {
  const transformed = await defaultTransformSource(
    source,
    context,
    defaultTransformSource,
  );
  if (context.format === 'module') {
    const transformedSource = transformed.source;
    if (typeof transformedSource !== 'string') {
      throw new Error('Expected source to have been transformed to a string.');
    }
    const newSrc = await transformClientModule(
      transformedSource,
      context.url,
      (url: string, ctx: LoadContext, defaultLoad: LoadFunction) => {
        return loadClientImport(url, defaultTransformSource);
      },
    );
    return {source: newSrc};
  }
  return transformed;
}

export async function load(
  url: string,
  context: LoadContext,
  defaultLoad: LoadFunction,
): Promise<{format: string, shortCircuit?: boolean, source: Source}> {
  if (context.format === 'module') {
    const result = await defaultLoad(url, context, defaultLoad);
    if (typeof result.source !== 'string') {
      throw new Error('Expected source to have been loaded into a string.');
    }
    const newSrc = await transformClientModule(result.source, url, defaultLoad);
    return {format: 'module', source: newSrc};
  }
  return defaultLoad(url, context, defaultLoad);
}
