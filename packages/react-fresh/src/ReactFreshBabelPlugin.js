/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export default function(babel) {
  const {types: t, template} = babel;

  const registrationsByProgramPath = new Map();
  function createRegistration(programPath, persistentID) {
    const handle = programPath.scope.generateUidIdentifier('c');
    if (!registrationsByProgramPath.has(programPath)) {
      registrationsByProgramPath.set(programPath, []);
    }
    const registrations = registrationsByProgramPath.get(programPath);
    registrations.push({
      handle,
      persistentID,
    });
    return handle;
  }

  const buildRegistrationCall = template(`
    __register__(HANDLE, PERSISTENT_ID);
  `);

  function isComponentishName(name) {
    return typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z';
  }

  function isComponentish(node) {
    switch (node.type) {
      case 'FunctionDeclaration':
        return node.id !== null && isComponentishName(node.id.name);
      case 'VariableDeclarator':
        return (
          isComponentishName(node.id.name) &&
          node.init !== null &&
          (node.init.type === 'FunctionExpression' ||
            (node.init.type === 'ArrowFunctionExpression' &&
              node.init.body.type !== 'ArrowFunctionExpression'))
        );
      default:
        return false;
    }
  }

  return {
    visitor: {
      FunctionDeclaration(path) {
        let programPath;
        let insertAfterPath;
        switch (path.parent.type) {
          case 'Program':
            insertAfterPath = path;
            programPath = path.parentPath;
            break;
          case 'ExportNamedDeclaration':
          case 'ExportDefaultDeclaration':
            insertAfterPath = path.parentPath;
            programPath = insertAfterPath.parentPath;
            break;
          default:
            return;
        }
        const maybeComponent = path.node;
        if (!isComponentish(maybeComponent)) {
          return;
        }
        const functionName = path.node.id.name;
        const handle = createRegistration(programPath, functionName);
        insertAfterPath.insertAfter(
          t.expressionStatement(
            t.assignmentExpression('=', handle, path.node.id),
          ),
        );
      },
      VariableDeclaration(path) {
        let programPath;
        switch (path.parent.type) {
          case 'Program':
            programPath = path.parentPath;
            break;
          case 'ExportNamedDeclaration':
          case 'ExportDefaultDeclaration':
            programPath = path.parentPath.parentPath;
            break;
          default:
            return;
        }
        const declPath = path.get('declarations');
        if (declPath.length !== 1) {
          return;
        }
        const firstDeclPath = declPath[0];
        const maybeComponent = firstDeclPath.node;
        if (!isComponentish(maybeComponent)) {
          return;
        }
        const functionName = maybeComponent.id.name;
        const initPath = firstDeclPath.get('init');
        const handle = createRegistration(programPath, functionName);
        initPath.replaceWith(
          t.assignmentExpression('=', handle, initPath.node),
        );
      },
      Program: {
        exit(path) {
          const registrations = registrationsByProgramPath.get(path);
          if (registrations === undefined) {
            return;
          }
          registrationsByProgramPath.delete(path);
          const declarators = [];
          path.pushContainer('body', t.variableDeclaration('var', declarators));
          registrations.forEach(({handle, persistentID}) => {
            path.pushContainer(
              'body',
              buildRegistrationCall({
                HANDLE: handle,
                PERSISTENT_ID: t.stringLiteral(persistentID),
              }),
            );
            declarators.push(t.variableDeclarator(handle));
          });
        },
      },
    },
  };
}
