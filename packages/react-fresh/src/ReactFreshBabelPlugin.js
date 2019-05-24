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
        // function Foo() {}
        // export function Foo() {}
        // export default function Foo() {}
        callback(inferredName, node.id, null);
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
        if (init.type === 'Identifier' || init.type === 'MemberExpression') {
          return false;
        }
        const initPath = path.get('init');
        const foundInside = findInnerComponents(
          inferredName,
          initPath,
          callback,
        );
        if (foundInside) {
          return true;
        }
        // See if this identifier is used in JSX. Then it's a component.
        const binding = path.scope.getBinding(name);
        if (binding === undefined) {
          return;
        }
        let isLikelyUsedAsType = false;
        const referencePaths = binding.referencePaths;
        for (let i = 0; i < referencePaths.length; i++) {
          const ref = referencePaths[i];
          if (
            ref.node.type !== 'JSXIdentifier' &&
            ref.node.type !== 'Identifier'
          ) {
            continue;
          }
          const refParent = ref.parent;
          if (refParent.type === 'JSXOpeningElement') {
            isLikelyUsedAsType = true;
          } else if (refParent.type === 'CallExpression') {
            const callee = refParent.callee;
            let fnName;
            switch (callee.type) {
              case 'Identifier':
                fnName = callee.name;
                break;
              case 'MemberExpression':
                fnName = callee.property.name;
                break;
            }
            switch (fnName) {
              case 'createElement':
              case 'jsx':
              case 'jsxDEV':
              case 'jsxs':
                isLikelyUsedAsType = true;
                break;
            }
          }
          if (isLikelyUsedAsType) {
            // const X = ... + later <X />
            callback(inferredName, init, initPath);
            return true;
          }
        }
      }
    }
    return false;
  }

  return {
    visitor: {
      ExportDefaultDeclaration(path) {
        const node = path.node;
        const decl = node.declaration;
        const declPath = path.get('declaration');
        if (decl.type !== 'CallExpression') {
          // For now, we only support possible HOC calls here.
          // Named function declarations are handled in FunctionDeclaration.
          // Anonymous direct exports like export default function() {}
          // are currently ignored.
          return;
        }
        // This code path handles nested cases like:
        // export default memo(() => {})
        // In those cases it is more plausible people will omit names
        // so they're worth handling despite possible false positives.
        // More importantly, it handles the named case:
        // export default memo(function Named() {})
        const inferredName = '%default%';
        const programPath = path.parentPath;
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
      FunctionDeclaration(path) {
        let programPath;
        let insertAfterPath;
        switch (path.parent.type) {
          case 'Program':
            insertAfterPath = path;
            programPath = path.parentPath;
            break;
          case 'ExportNamedDeclaration':
            insertAfterPath = path.parentPath;
            programPath = insertAfterPath.parentPath;
            break;
          case 'ExportDefaultDeclaration':
            insertAfterPath = path.parentPath;
            programPath = insertAfterPath.parentPath;
            break;
          default:
            return;
        }
        const id = path.node.id;
        if (id === null) {
          // We don't currently handle anonymous default exports.
          return;
        }
        const inferredName = id.name;
        if (!isComponentishName(inferredName)) {
          return;
        }
        // export function Named() {}
        // function Named() {}
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
