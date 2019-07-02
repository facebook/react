/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export default function(babel) {
  if (typeof babel.getEnv === 'function') {
    // Only available in Babel 7.
    const env = babel.getEnv();
    if (env !== 'development') {
      throw new Error(
        'React Refresh Babel transform should only be enabled in development environment. ' +
          'Instead, the environment is: "' +
          env +
          '".',
      );
    }
  }

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
      case 'Identifier': {
        if (!isComponentishName(node.name)) {
          return false;
        }
        // export default hoc(Foo)
        // const X = hoc(Foo)
        callback(inferredName, node, null);
        return true;
      }
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
        switch (init.type) {
          case 'ArrowFunctionExpression':
          case 'FunctionExpression':
            // Likely component definitions.
            break;
          case 'CallExpression': {
            // Maybe a HOC.
            // Try to determine if this is some form of import.
            const callee = init.callee;
            const calleeType = callee.type;
            if (calleeType === 'Import') {
              return false;
            } else if (calleeType === 'Identifier') {
              if (callee.name.indexOf('require') === 0) {
                return false;
              } else if (callee.name.indexOf('import') === 0) {
                return false;
              }
              // Neither require nor import. Might be a HOC.
              // Pass through.
            } else if (calleeType === 'MemberExpression') {
              // Could be something like React.forwardRef(...)
              // Pass through.
            } else {
              // More complicated call.
              return false;
            }
            break;
          }
          case 'TaggedTemplateExpression':
            // Maybe something like styled.div`...`
            break;
          default:
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

  function isBuiltinHook(hookName) {
    switch (hookName) {
      case 'useState':
      case 'React.useState':
      case 'useReducer':
      case 'React.useReducer':
      case 'useEffect':
      case 'React.useEffect':
      case 'useLayoutEffect':
      case 'React.useLayoutEffect':
      case 'useMemo':
      case 'React.useMemo':
      case 'useCallback':
      case 'React.useCallback':
      case 'useRef':
      case 'React.useRef':
      case 'useContext':
      case 'React.useContext':
      case 'useImperativeMethods':
      case 'React.useImperativeMethods':
      case 'useDebugValue':
      case 'React.useDebugValue':
        return true;
      default:
        return false;
    }
  }

  function getHookCallsSignature(functionNode) {
    const fnHookCalls = hookCalls.get(functionNode);
    if (fnHookCalls === undefined) {
      return null;
    }
    return {
      key: fnHookCalls.map(call => call.name + '{' + call.key + '}').join('\n'),
      customHooks: fnHookCalls
        .filter(call => !isBuiltinHook(call.name))
        .map(call => t.cloneDeep(call.callee)),
    };
  }

  let hasForceResetCommentByFile = new WeakMap();

  // We let user do /* @refresh reset */ to reset state in the whole file.
  function hasForceResetComment(path) {
    const file = path.hub.file;
    let hasForceReset = hasForceResetCommentByFile.get(file);
    if (hasForceReset !== undefined) {
      return hasForceReset;
    }

    hasForceReset = false;
    const comments = file.ast.comments;
    for (let i = 0; i < comments.length; i++) {
      const cmt = comments[i];
      if (cmt.value.indexOf('@refresh reset') !== -1) {
        hasForceReset = true;
        break;
      }
    }

    hasForceResetCommentByFile.set(file, hasForceReset);
    return hasForceReset;
  }

  function createArgumentsForSignature(node, signature, scope) {
    const {key, customHooks} = signature;

    let forceReset = hasForceResetComment(scope.path);
    let customHooksInScope = [];
    customHooks.forEach(callee => {
      // Check if a correponding binding exists where we emit the signature.
      let bindingName;
      switch (callee.type) {
        case 'MemberExpression':
          if (callee.object.type === 'Identifier') {
            bindingName = callee.object.name;
          }
          break;
        case 'Identifier':
          bindingName = callee.name;
          break;
      }
      if (scope.hasBinding(bindingName)) {
        customHooksInScope.push(callee);
      } else {
        // We don't have anything to put in the array because Hook is out of scope.
        // Since it could potentially have been edited, remount the component.
        forceReset = true;
      }
    });

    const args = [node, t.stringLiteral(key)];
    if (forceReset || customHooksInScope.length > 0) {
      args.push(t.booleanLiteral(forceReset));
    }
    if (customHooksInScope.length > 0) {
      args.push(
        // TODO: We could use an arrow here to be more compact.
        // However, don't do it until AMA can run them natively.
        t.functionExpression(
          null,
          [],
          t.blockStatement([
            t.returnStatement(t.arrayExpression(customHooksInScope)),
          ]),
        ),
      );
    }
    return args;
  }

  let seenForRegistration = new WeakSet();
  let seenForSignature = new WeakSet();
  let seenForOutro = new WeakSet();

  let hookCalls = new WeakMap();
  const HookCallsVisitor = {
    CallExpression(path) {
      const node = path.node;
      const callee = node.callee;

      // Note: this visitor MUST NOT mutate the tree in any way.
      // It runs early in a separate traversal and should be very fast.

      let name = null;
      switch (callee.type) {
        case 'Identifier':
          name = callee.name;
          break;
        case 'MemberExpression':
          name = callee.property.name;
          break;
      }
      if (name === null || !/^use[A-Z]/.test(name)) {
        return;
      }
      const fnScope = path.scope.getFunctionParent();
      if (fnScope === null) {
        return;
      }

      // This is a Hook call. Record it.
      const fnNode = fnScope.block;
      if (!hookCalls.has(fnNode)) {
        hookCalls.set(fnNode, []);
      }
      let hookCallsForFn = hookCalls.get(fnNode);
      let key = '';
      if (path.parent.type === 'VariableDeclarator') {
        // TODO: if there is no LHS, consider some other heuristic.
        key = path.parentPath.get('id').getSource();
      }

      // Some built-in Hooks reset on edits to arguments.
      const args = path.get('arguments');
      if (name === 'useState' && args.length > 0) {
        // useState second argument is initial state.
        key += '(' + args[0].getSource() + ')';
      } else if (name === 'useReducer' && args.length > 1) {
        // useReducer second argument is initial state.
        key += '(' + args[1].getSource() + ')';
      }

      hookCallsForFn.push({
        callee: path.node.callee,
        name,
        key,
      });
    },
  };

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
            if (targetPath === null) {
              // For case like:
              // export default hoc(Foo)
              // we don't want to wrap Foo inside the call.
              // Instead we assume it's registered at definition.
              return;
            }
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
          // Don't mutate the tree above this point.

          const sigCallID = path.scope.generateUidIdentifier('_s');
          path.scope.parent.push({
            id: sigCallID,
            init: t.callExpression(t.identifier('$RefreshSig$'), []),
          });

          // The signature call is split in two parts. One part is called inside the function.
          // This is used to signal when first render happens.
          path
            .get('body')
            .unshiftContainer(
              'body',
              t.expressionStatement(t.callExpression(sigCallID, [])),
            );

          // The second call is around the function itself.
          // This is used to associate a type with a signature.

          // Unlike with $RefreshReg$, this needs to work for nested
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
              t.callExpression(
                sigCallID,
                createArgumentsForSignature(
                  id,
                  signature,
                  insertAfterPath.scope,
                ),
              ),
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

          const sigCallID = path.scope.generateUidIdentifier('_s');
          path.scope.parent.push({
            id: sigCallID,
            init: t.callExpression(t.identifier('$RefreshSig$'), []),
          });

          // The signature call is split in two parts. One part is called inside the function.
          // This is used to signal when first render happens.
          path
            .get('body')
            .unshiftContainer(
              'body',
              t.expressionStatement(t.callExpression(sigCallID, [])),
            );

          // The second call is around the function itself.
          // This is used to associate a type with a signature.

          if (path.parent.type === 'VariableDeclarator') {
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
            // Special case when a function would get an inferred name:
            // let Foo = () => {}
            // let Foo = function() {}
            // We'll add signature it on next line so that
            // we don't mess up the inferred 'Foo' function name.
            insertAfterPath.insertAfter(
              t.expressionStatement(
                t.callExpression(
                  sigCallID,
                  createArgumentsForSignature(
                    path.parent.id,
                    signature,
                    insertAfterPath.scope,
                  ),
                ),
              ),
            );
            // Result: let Foo = () => {}; __signature(Foo, ...);
          } else {
            // let Foo = hoc(() => {})
            path.replaceWith(
              t.callExpression(
                sigCallID,
                createArgumentsForSignature(node, signature, path.scope),
              ),
            );
            // Result: let Foo = hoc(__signature(() => {}, ...))
          }
        },
      },
      VariableDeclaration(path) {
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
            if (targetPath === null) {
              // For case like:
              // export const Something = hoc(Foo)
              // we don't want to wrap Foo inside the call.
              // Instead we assume it's registered at definition.
              return;
            }
            const handle = createRegistration(programPath, persistentID);
            if (
              (targetExpr.type === 'ArrowFunctionExpression' ||
                targetExpr.type === 'FunctionExpression') &&
              targetPath.parent.type === 'VariableDeclarator'
            ) {
              // Special case when a function would get an inferred name:
              // let Foo = () => {}
              // let Foo = function() {}
              // We'll register it on next line so that
              // we don't mess up the inferred 'Foo' function name.
              insertAfterPath.insertAfter(
                t.expressionStatement(
                  t.assignmentExpression('=', handle, declPath.node.id),
                ),
              );
              // Result: let Foo = () => {}; _c1 = Foo;
            } else {
              // let Foo = hoc(() => {})
              targetPath.replaceWith(
                t.assignmentExpression('=', handle, targetExpr),
              );
              // Result: let Foo = _c1 = hoc(() => {})
            }
          },
        );
      },
      Program: {
        enter(path) {
          // This is a separate early visitor because we need to collect Hook calls
          // and "const [foo, setFoo] = ..." signatures before the destructuring
          // transform mangles them. This extra traversal is not ideal for perf,
          // but it's the best we can do until we stop transpiling destructuring.
          path.traverse(HookCallsVisitor);
        },
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
                t.callExpression(t.identifier('$RefreshReg$'), [
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
