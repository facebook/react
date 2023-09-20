/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from 'acorn-loose';
import {readFileSync} from 'fs';

export default function reactServer({
  hash = str => str,
  onClientReference = () => {},
  onServerReference = () => {},
}: {
  hash?: string => string,
  onClientReference?: (id: string) => void,
  onServerReference?: (id: string) => void,
} = {}): any {
  let isBuild;
  return {
    name: 'react-server',

    enforce: 'pre',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    transform(code, id, options) {
      if (!options?.ssr) return;

      async function transformModuleIfNeeded(
        moduleCode: string,
        moduleId: string,
      ) {
        // Do a quick check for the exact string. If it doesn't exist, don't
        // bother parsing.
        if (
          moduleCode.indexOf('use client') === -1 &&
          moduleCode.indexOf('use server') === -1
        ) {
          return moduleCode;
        }

        const body = parse(moduleCode, {
          ecmaVersion: '2024',
          sourceType: 'module',
        }).body;

        let useClient = false;
        let useServer = false;
        for (let i = 0; i < body.length; i++) {
          const node = body[i];
          if (node.type !== 'ExpressionStatement' || !node.directive) {
            break;
          }
          if (node.directive === 'use client') {
            useClient = true;
          }
          if (node.directive === 'use server') {
            useServer = true;
          }
        }

        if (!useClient && !useServer) {
          return moduleCode;
        }

        if (useClient && useServer) {
          throw new Error(
            'Cannot have both "use client" and "use server" directives in the same file.',
          );
        }

        if (useClient) {
          return transformClientModule(body, moduleId);
        }

        return transformServerModule(moduleCode, body, moduleId);
      }

      async function transformClientModule(moduleAst: any, moduleId: string) {
        const names: string[] = [];
        onClientReference(moduleId);
        await parseExportNamesInto(moduleAst, names, moduleId);

        let newSrc = `import { createClientReference } from 'react-server-dom-vite/runtime';\n`;
        for (let i = 0; i < names.length; i++) {
          const name = names[i];
          if (name === 'default') {
            newSrc += 'export default createClientReference(';
          } else {
            newSrc += 'export const ' + name + ' = createClientReference(';
          }
          newSrc += `"${isBuild ? hash(moduleId) : moduleId}", "${name}");\n`;
        }
        return newSrc;
      }

      function transformServerModule(
        moduleCode: string,
        moduleAst: any,
        moduleId: string,
      ) {
        onServerReference(moduleId);

        // If the same local name is exported more than once, we only need one of the names.
        const localNames = new Map<string, any>();
        const localTypes = new Map<string, any>();

        for (let i = 0; i < moduleAst.length; i++) {
          const node = moduleAst[i];
          switch (node.type) {
            case 'ExportAllDeclaration':
              // If export * is used, the other file needs to explicitly opt into "use server" too.
              break;
            case 'ExportDefaultDeclaration':
              if (node.declaration.type === 'Identifier') {
                localNames.set(node.declaration.name, 'default');
              } else if (node.declaration.type === 'FunctionDeclaration') {
                if (node.declaration.id) {
                  localNames.set(node.declaration.id.name, 'default');
                  localTypes.set(node.declaration.id.name, 'function');
                } else {
                  // TODO: This needs to be rewritten inline because it doesn't have a local name.
                }
              }
              continue;
            case 'ExportNamedDeclaration':
              if (node.declaration) {
                if (node.declaration.type === 'VariableDeclaration') {
                  const declarations = node.declaration.declarations;
                  for (let j = 0; j < declarations.length; j++) {
                    addLocalExportedNames(localNames, declarations[j].id);
                  }
                } else {
                  const name = node.declaration.id.name;
                  localNames.set(name, name);
                  if (node.declaration.type === 'FunctionDeclaration') {
                    localTypes.set(name, 'function');
                  }
                }
              }
              if (node.specifiers) {
                const specifiers = node.specifiers;
                for (let j = 0; j < specifiers.length; j++) {
                  const specifier = specifiers[j];
                  localNames.set(specifier.local.name, specifier.exported.name);
                }
              }
              continue;
          }
        }

        let newSrc =
          `import { createServerReference } from 'react-server-dom-vite/runtime';\n` +
          moduleCode +
          '\n\n;';
        localNames.forEach(function (exported, local) {
          if (localTypes.get(local) !== 'function') {
            // We first check if the export is a function and if so annotate it.
            newSrc += 'if (typeof ' + local + ' === "function") ';
          }
          newSrc += 'createServerReference(' + local + ',';
          newSrc += `"${
            isBuild ? hash(moduleId) : moduleId
          }", "${exported}");\n`;
        });
        return newSrc;
      }

      async function parseExportNamesInto(
        ast: any,
        names: string[],
        parentURL: string,
      ) {
        for (let i = 0; i < ast.length; i++) {
          const node = ast[i];
          switch (node.type) {
            case 'ExportAllDeclaration':
              if (node.exported) {
                addExportNames(names, node.exported);
                continue;
              } else {
                const {url} = await resolveClientImport(
                  node.source.value,
                  parentURL,
                );

                const clientImportCode = readFileSync(url, 'utf8');

                const childBody = parse(clientImportCode ?? '', {
                  ecmaVersion: '2024',
                  sourceType: 'module',
                }).body;

                await parseExportNamesInto(childBody, names, url);
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

      function addLocalExportedNames(names: Map<string, any>, node: any) {
        switch (node.type) {
          case 'Identifier':
            names.set(node.name, node.name);
            return;
          case 'ObjectPattern':
            for (let i = 0; i < node.properties.length; i++)
              addLocalExportedNames(names, node.properties[i]);
            return;
          case 'ArrayPattern':
            for (let i = 0; i < node.elements.length; i++) {
              const element = node.elements[i];
              if (element) addLocalExportedNames(names, element);
            }
            return;
          case 'Property':
            addLocalExportedNames(names, node.value);
            return;
          case 'AssignmentPattern':
            addLocalExportedNames(names, node.left);
            return;
          case 'RestElement':
            addLocalExportedNames(names, node.argument);
            return;
          case 'ParenthesizedExpression':
            addLocalExportedNames(names, node.expression);
            return;
        }
      }

      function addExportNames(names: string[], node: any) {
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

      async function resolveClientImport(specifier: string, parentURL: string) {
        const resolved = await self.resolve(specifier, parentURL, {
          skipSelf: true,
        });

        if (!resolved) {
          throw new Error(
            'Could not resolve ' + specifier + ' from ' + parentURL,
          );
        }

        return {url: resolved.id};
      }

      // $FlowFixMe[object-this-reference]
      const self = this;

      return transformModuleIfNeeded(code, id);
    },
  };
}
