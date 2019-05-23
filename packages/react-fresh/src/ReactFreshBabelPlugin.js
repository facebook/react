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

  function findLikelyComponents(path, callback) {
    const node = path.node;
    switch (node.type) {
      case 'FunctionDeclaration': {
        const id = node.id;
        if (id === null) {
          return;
        }
        const name = id.name;
        if (!isComponentishName(name)) {
          return;
        }
        // function Foo() {}
        callback(name, id);
        break;
      }
      case 'VariableDeclarator': {
        const name = node.id.name;
        if (!isComponentishName(name)) {
          return;
        }
        const init = node.init;
        if (init === null) {
          return;
        }
        const initPath = path.get('init');
        const initNode = initPath.node;
        switch (initNode.type) {
          case 'FunctionExpression': {
            // let Foo = function() {}
            callback(name, initNode, initPath);
            break;
          }
          case 'ArrowFunctionExpression': {
            if (initNode.body.type !== 'ArrowFunctionExpression') {
              // let Foo = () => {}
              callback(name, initNode, initPath);
              break;
            }
          }
        }
      }
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
        // While we reuse this function, in this case it won't
        // go more than one level deep because we're at the leaf.
        findLikelyComponents(path, (persistentID, targetExpr) => {
          const handle = createRegistration(programPath, persistentID);
          insertAfterPath.insertAfter(
            t.expressionStatement(
              t.assignmentExpression('=', handle, targetExpr),
            ),
          );
        });
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
        const declPaths = path.get('declarations');
        if (declPaths.length !== 1) {
          return;
        }
        const declPath = declPaths[0];
        findLikelyComponents(
          declPath,
          (persistentID, targetExpr, targetPath) => {
            const handle = createRegistration(programPath, persistentID);
            targetPath.replaceWith(
              t.assignmentExpression('=', handle, targetExpr),
            );
          },
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
