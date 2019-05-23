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

  function findInnerComponents(inferredName, path, callback) {
    const node = path.node;
    switch (node.type) {
      case 'FunctionDeclaration': {
        const id = node.id;
        if (id === null) {
          return false;
        }
        const name = id.name;
        if (!isComponentishName(name)) {
          return false;
        }
        // function Foo() {}
        // export function Foo() {}
        // export default function Foo() {}
        callback(name, id, null);
        return true;
      }
      case 'ArrowFunctionExpression': {
        if (node.body.type === 'ArrowFunctionExpression') {
          return false;
        }
        // let Foo = () => {}
        // export default hoc1(hoc2(() => {}))
        callback(inferredName, node, path);
        return true;
      }
      case 'FunctionExpression': {
        // let Foo = function() {}
        // const Foo = hoc1(forwardRef(function renderFoo() {}))
        // export default memo(function() {})
        callback(inferredName, node, path);
        return true;
      }
      case 'CallExpression': {
        const argsPath = path.get('arguments');
        if (argsPath === undefined || argsPath.length === 0) {
          return false;
        }
        const calleePath = path.get('callee');
        switch (calleePath.node.type) {
          case 'MemberExpression':
          case 'Identifier': {
            const calleeSource = calleePath.getSource();
            const firstArgPath = argsPath[0];
            const innerName = inferredName + '$' + calleeSource;
            const foundInside = findInnerComponents(
              innerName,
              firstArgPath,
              callback,
            );
            if (!foundInside) {
              return false;
            }
            // const Foo = hoc1(hoc2(() => {}))
            // export default memo(React.forwardRef(function() {}))
            callback(inferredName, node, path);
            return true;
          }
          default: {
            return false;
          }
        }
      }
      case 'VariableDeclarator': {
        const init = node.init;
        if (init === null) {
          return false;
        }
        const name = node.id.name;
        if (!isComponentishName(name)) {
          return false;
        }
        const initPath = path.get('init');
        return findInnerComponents(inferredName, initPath, callback);
      }
    }
    return false;
  }

  return {
    visitor: {
      FunctionDeclaration(path) {
        let programPath;
        let insertAfterPath;
        let inferredName;
        switch (path.parent.type) {
          case 'Program':
            insertAfterPath = path;
            programPath = path.parentPath;
            inferredName = path.node.id.name;
            break;
          case 'ExportNamedDeclaration':
            insertAfterPath = path.parentPath;
            programPath = insertAfterPath.parentPath;
            inferredName = path.node.id.name;
            break;
          case 'ExportDefaultDeclaration':
            insertAfterPath = path.parentPath;
            programPath = insertAfterPath.parentPath;
            inferredName = '%default%';
            break;
          default:
            return;
        }
        // While we reuse this function, in this case it won't
        // go more than one level deep because we're at the leaf.
        findInnerComponents(inferredName, path, (persistentID, targetExpr) => {
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
        const inferredName = declPath.node.id.name;
        findInnerComponents(
          inferredName,
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
