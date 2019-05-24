/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export default function(babel) {
  const {types: t} = babel;

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

  let hookCalls = new WeakMap();

  function recordHookCall(functionNode, hookCallPath) {
    if (!hookCalls.has(functionNode)) {
      hookCalls.set(functionNode, []);
    }
    let hookCallsForFn = hookCalls.get(functionNode);
    let key = '';
    if (hookCallPath.parent.type === 'VariableDeclarator') {
      // TODO: if there is no LHS, consider some other heuristic.
      key = hookCallPath.parentPath.get('id').getSource();
    }
    hookCallsForFn.push({
      name: hookCallPath.node.callee.name,
      key,
    });
  }

  function getHookCallsSignature(functionNode) {
    const fnHookCalls = hookCalls.get(functionNode);
    if (fnHookCalls === undefined) {
      return null;
    }
    return fnHookCalls.map(call => call.name + '{' + call.key + '}').join('\n');
  }

  let seenForRegistration = new WeakSet();
  let seenForSignature = new WeakSet();
  let seenForHookCalls = new WeakSet();
  let seenForOutro = new WeakSet();

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

        // Make sure we're not mutating the same tree twice.
        // This can happen if another Babel plugin replaces parents.
        if (seenForRegistration.has(node)) {
          return;
        }
        seenForRegistration.add(node);
        // Don't mutate the tree above this point.

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
      FunctionDeclaration: {
        enter(path) {
          const node = path.node;
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
          const id = node.id;
          if (id === null) {
            // We don't currently handle anonymous default exports.
            return;
          }
          const inferredName = id.name;
          if (!isComponentishName(inferredName)) {
            return;
          }

          // Make sure we're not mutating the same tree twice.
          // This can happen if another Babel plugin replaces parents.
          if (seenForRegistration.has(node)) {
            return;
          }
          seenForRegistration.add(node);
          // Don't mutate the tree above this point.

          // export function Named() {}
          // function Named() {}
          findInnerComponents(
            inferredName,
            path,
            (persistentID, targetExpr) => {
              const handle = createRegistration(programPath, persistentID);
              insertAfterPath.insertAfter(
                t.expressionStatement(
                  t.assignmentExpression('=', handle, targetExpr),
                ),
              );
            },
          );
        },
        exit(path) {
          const node = path.node;
          const id = node.id;
          if (id === null) {
            return;
          }
          const signature = getHookCallsSignature(node);
          if (signature === null) {
            return;
          }

          // Make sure we're not mutating the same tree twice.
          // This can happen if another Babel plugin replaces parents.
          if (seenForSignature.has(node)) {
            return;
          }
          seenForSignature.add(node);
          // Don't muatte the tree above this point.

          // Unlike with __register__, this needs to work for nested
          // declarations too. So we need to search for a path where
          // we can insert a statement rather than hardcoding it.
          let insertAfterPath = null;
          path.find(p => {
            if (p.parentPath.isBlock()) {
              insertAfterPath = p;
              return true;
            }
          });
          if (insertAfterPath === null) {
            return;
          }
          insertAfterPath.insertAfter(
            t.expressionStatement(
              t.callExpression(t.identifier('__signature__'), [
                id,
                t.stringLiteral(signature),
              ]),
            ),
          );
        },
      },
      'ArrowFunctionExpression|FunctionExpression': {
        exit(path) {
          const node = path.node;
          const signature = getHookCallsSignature(node);
          if (signature === null) {
            return;
          }

          // Make sure we're not mutating the same tree twice.
          // This can happen if another Babel plugin replaces parents.
          if (seenForSignature.has(node)) {
            return;
          }
          seenForSignature.add(node);
          // Don't mutate the tree above this point.

          path.replaceWith(
            t.callExpression(t.identifier('__signature__'), [
              node,
              t.stringLiteral(signature),
            ]),
          );
        },
      },
      VariableDeclaration(path) {
        const node = path.node;
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

        // Make sure we're not mutating the same tree twice.
        // This can happen if another Babel plugin replaces parents.
        if (seenForRegistration.has(node)) {
          return;
        }
        seenForRegistration.add(node);
        // Don't mutate the tree above this point.

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
      CallExpression(path) {
        const node = path.node;
        const name = path.node.callee.name;
        if (!/^use[A-Z]/.test(name)) {
          return;
        }

        // Make sure we're not recording the same calls twice.
        // This can happen if another Babel plugin replaces parents.
        if (seenForHookCalls.has(node)) {
          return;
        }
        seenForHookCalls.add(node);
        // Don't mutate the tree above this point.

        const fn = path.scope.getFunctionParent();
        if (fn === null) {
          return;
        }
        recordHookCall(fn.block, path);
      },
      Program: {
        exit(path) {
          const registrations = registrationsByProgramPath.get(path);
          if (registrations === undefined) {
            return;
          }

          // Make sure we're not mutating the same tree twice.
          // This can happen if another Babel plugin replaces parents.
          const node = path.node;
          if (seenForOutro.has(node)) {
            return;
          }
          seenForOutro.add(node);
          // Don't mutate the tree above this point.

          registrationsByProgramPath.delete(path);
          const declarators = [];
          path.pushContainer('body', t.variableDeclaration('var', declarators));
          registrations.forEach(({handle, persistentID}) => {
            path.pushContainer(
              'body',
              t.expressionStatement(
                t.callExpression(t.identifier('__register__'), [
                  handle,
                  t.stringLiteral(persistentID),
                ]),
              ),
            );
            declarators.push(t.variableDeclarator(handle));
          });
        },
      },
    },
  };
}
