/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  const resolved = await defaultResolve(specifier, context, defaultResolve);
  if (resolved.url.endsWith('.server.js')) {
    const parentURL = context.parentURL;
    if (parentURL && !parentURL.endsWith('.server.js')) {
      let reason;
      if (specifier.endsWith('.server.js')) {
        reason = `"${specifier}"`;
      } else {
        reason = `"${specifier}" (which expands to "${resolved.url}")`;
      }
      throw new Error(
        `Cannot import ${reason} from "${parentURL}". ` +
          'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
          'That way nobody accidentally sends these to the client by indirectly importing it.',
      );
    }
  }
  return resolved;
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

function addExportNames(names, node) {
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

async function loadClientImport(
  url: string,
  defaultTransformSource: TransformSourceFunction,
): Promise<{source: Source}> {
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
  return defaultTransformSource(
    source,
    {format: 'module', url},
    defaultTransformSource,
  );
}

async function parseExportNamesInto(
  transformedSource: string,
  names: Array<string>,
  parentURL: string,
  defaultTransformSource,
): Promise<void> {
  const {body} = acorn.parse(transformedSource, {
    ecmaVersion: '2019',
    sourceType: 'module',
  });
  for (let i = 0; i < body.length; i++) {
    const node = body[i];
    switch (node.type) {
      case 'ExportAllDeclaration':
        if (node.exported) {
          addExportNames(names, node.exported);
          continue;
        } else {
          const {url} = await resolveClientImport(node.source.value, parentURL);
          const {source} = await loadClientImport(url, defaultTransformSource);
          if (typeof source !== 'string') {
            throw new Error('Expected the transformed source to be a string.');
          }
          parseExportNamesInto(source, names, url, defaultTransformSource);
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
  if (context.format === 'module' && context.url.endsWith('.client.js')) {
    const transformedSource = transformed.source;
    if (typeof transformedSource !== 'string') {
      throw new Error('Expected source to have been transformed to a string.');
    }

    const names = [];
    await parseExportNamesInto(
      transformedSource,
      names,
      context.url,
      defaultTransformSource,
    );

    let newSrc =
      "const MODULE_REFERENCE = Symbol.for('react.module.reference');\n";
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (name === 'default') {
        newSrc += 'export default ';
      } else {
        newSrc += 'export const ' + name + ' = ';
      }
      newSrc += '{ $$typeof: MODULE_REFERENCE, filepath: ';
      newSrc += JSON.stringify(context.url);
      newSrc += ', name: ';
      newSrc += JSON.stringify(name);
      newSrc += '};\n';
    }

    return {source: newSrc};
  }
  return transformed;
}
