/**
 *
 * react-refresh-babel.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @lightSyntaxTransform
 * @preventMunge
 * @oncall react_core
 */

"use strict";
"production" !== process.env.NODE_ENV &&
  (module.exports = function (babel) {
    function createRegistration(programPath, persistentID) {
      var handle = programPath.scope.generateUidIdentifier("c");
      registrationsByProgramPath.has(programPath) ||
        registrationsByProgramPath.set(programPath, []);
      registrationsByProgramPath
        .get(programPath)
        .push({ handle: handle, persistentID: persistentID });
      return handle;
    }
    function isComponentishName(name) {
      return "string" === typeof name && "A" <= name[0] && "Z" >= name[0];
    }
    function findInnerComponents(inferredName, path, callback) {
      var node = path.node;
      switch (node.type) {
        case "Identifier":
          if (!isComponentishName(node.name)) break;
          callback(inferredName, node, null);
          return !0;
        case "FunctionDeclaration":
          return callback(inferredName, node.id, null), !0;
        case "ArrowFunctionExpression":
          if ("ArrowFunctionExpression" === node.body.type) break;
          callback(inferredName, node, path);
          return !0;
        case "FunctionExpression":
          return callback(inferredName, node, path), !0;
        case "CallExpression":
          var argsPath = path.get("arguments");
          if (void 0 === argsPath || 0 === argsPath.length) break;
          var calleePath = path.get("callee");
          switch (calleePath.node.type) {
            case "MemberExpression":
            case "Identifier":
              calleePath = calleePath.getSource();
              if (
                !findInnerComponents(
                  inferredName + "$" + calleePath,
                  argsPath[0],
                  callback
                )
              )
                return !1;
              callback(inferredName, node, path);
              return !0;
            default:
              return !1;
          }
        case "VariableDeclarator":
          if (
            ((argsPath = node.init),
            null !== argsPath &&
              ((calleePath = node.id.name), isComponentishName(calleePath)))
          ) {
            switch (argsPath.type) {
              case "ArrowFunctionExpression":
              case "FunctionExpression":
                break;
              case "CallExpression":
                node = argsPath.callee;
                var calleeType = node.type;
                if (
                  "Import" === calleeType ||
                  ("Identifier" === calleeType &&
                    (0 === node.name.indexOf("require") ||
                      0 === node.name.indexOf("import")))
                )
                  return !1;
                break;
              case "TaggedTemplateExpression":
                break;
              default:
                return !1;
            }
            node = path.get("init");
            if (findInnerComponents(inferredName, node, callback)) return !0;
            calleePath = path.scope.getBinding(calleePath);
            if (void 0 === calleePath) return;
            path = !1;
            calleePath = calleePath.referencePaths;
            for (calleeType = 0; calleeType < calleePath.length; calleeType++) {
              var ref = calleePath[calleeType];
              if (
                !ref.node ||
                "JSXIdentifier" === ref.node.type ||
                "Identifier" === ref.node.type
              ) {
                ref = ref.parent;
                if ("JSXOpeningElement" === ref.type) path = !0;
                else if ("CallExpression" === ref.type) {
                  ref = ref.callee;
                  var fnName = void 0;
                  switch (ref.type) {
                    case "Identifier":
                      fnName = ref.name;
                      break;
                    case "MemberExpression":
                      fnName = ref.property.name;
                  }
                  switch (fnName) {
                    case "createElement":
                    case "jsx":
                    case "jsxDEV":
                    case "jsxs":
                      path = !0;
                  }
                }
                if (path) return callback(inferredName, argsPath, node), !0;
              }
            }
          }
      }
      return !1;
    }
    function getHookCallsSignature(functionNode) {
      functionNode = hookCalls.get(functionNode);
      return void 0 === functionNode
        ? null
        : {
            key: functionNode
              .map(function (call) {
                return call.name + "{" + call.key + "}";
              })
              .join("\n"),
            customHooks: functionNode
              .filter(function (call) {
                a: switch (call.name) {
                  case "useState":
                  case "React.useState":
                  case "useReducer":
                  case "React.useReducer":
                  case "useEffect":
                  case "React.useEffect":
                  case "useLayoutEffect":
                  case "React.useLayoutEffect":
                  case "useMemo":
                  case "React.useMemo":
                  case "useCallback":
                  case "React.useCallback":
                  case "useRef":
                  case "React.useRef":
                  case "useContext":
                  case "React.useContext":
                  case "useImperativeHandle":
                  case "React.useImperativeHandle":
                  case "useDebugValue":
                  case "React.useDebugValue":
                  case "useId":
                  case "React.useId":
                  case "useDeferredValue":
                  case "React.useDeferredValue":
                  case "useTransition":
                  case "React.useTransition":
                  case "useInsertionEffect":
                  case "React.useInsertionEffect":
                  case "useSyncExternalStore":
                  case "React.useSyncExternalStore":
                  case "useFormStatus":
                  case "React.useFormStatus":
                  case "useFormState":
                  case "React.useFormState":
                  case "useActionState":
                  case "React.useActionState":
                  case "useOptimistic":
                  case "React.useOptimistic":
                    call = !0;
                    break a;
                  default:
                    call = !1;
                }
                return !call;
              })
              .map(function (call) {
                return t.cloneDeep(call.callee);
              })
          };
    }
    function hasForceResetComment(path) {
      path = path.hub.file;
      var hasForceReset = hasForceResetCommentByFile.get(path);
      if (void 0 !== hasForceReset) return hasForceReset;
      hasForceReset = !1;
      for (var comments = path.ast.comments, i = 0; i < comments.length; i++)
        if (-1 !== comments[i].value.indexOf("@refresh reset")) {
          hasForceReset = !0;
          break;
        }
      hasForceResetCommentByFile.set(path, hasForceReset);
      return hasForceReset;
    }
    function createArgumentsForSignature(node, signature, scope) {
      var key = signature.key;
      signature = signature.customHooks;
      var forceReset = hasForceResetComment(scope.path),
        customHooksInScope = [];
      signature.forEach(function (callee) {
        switch (callee.type) {
          case "MemberExpression":
            if ("Identifier" === callee.object.type)
              var bindingName = callee.object.name;
            break;
          case "Identifier":
            bindingName = callee.name;
        }
        scope.hasBinding(bindingName)
          ? customHooksInScope.push(callee)
          : (forceReset = !0);
      });
      signature = key;
      "function" !== typeof require ||
        opts.emitFullSignatures ||
        (signature = require("crypto")
          .createHash("sha1")
          .update(key)
          .digest("base64"));
      node = [node, t.stringLiteral(signature)];
      (forceReset || 0 < customHooksInScope.length) &&
        node.push(t.booleanLiteral(forceReset));
      0 < customHooksInScope.length &&
        node.push(
          t.functionExpression(
            null,
            [],
            t.blockStatement([
              t.returnStatement(t.arrayExpression(customHooksInScope))
            ])
          )
        );
      return node;
    }
    function findHOCCallPathsAbove(path) {
      for (var calls = []; ; ) {
        if (!path) return calls;
        var parentPath = path.parentPath;
        if (!parentPath) return calls;
        if (
          "AssignmentExpression" === parentPath.node.type &&
          path.node === parentPath.node.right
        )
          path = parentPath;
        else if (
          "CallExpression" === parentPath.node.type &&
          path.node !== parentPath.node.callee
        )
          calls.push(parentPath), (path = parentPath);
        else return calls;
      }
    }
    var opts =
      1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {};
    if ("function" === typeof babel.env) {
      var env = babel.env();
      if ("development" !== env && !opts.skipEnvCheck)
        throw Error(
          'React Refresh Babel transform should only be enabled in development environment. Instead, the environment is: "' +
            env +
            '". If you want to override this check, pass {skipEnvCheck: true} as plugin options.'
        );
    }
    var t = babel.types,
      refreshReg = t.identifier(opts.refreshReg || "$RefreshReg$"),
      refreshSig = t.identifier(opts.refreshSig || "$RefreshSig$"),
      registrationsByProgramPath = new Map(),
      hasForceResetCommentByFile = new WeakMap(),
      seenForRegistration = new WeakSet(),
      seenForSignature = new WeakSet(),
      seenForOutro = new WeakSet(),
      hookCalls = new WeakMap(),
      HookCallsVisitor = {
        CallExpression: function (path) {
          var callee = path.node.callee,
            name = null;
          switch (callee.type) {
            case "Identifier":
              name = callee.name;
              break;
            case "MemberExpression":
              name = callee.property.name;
          }
          if (
            null !== name &&
            /^use[A-Z]/.test(name) &&
            ((callee = path.scope.getFunctionParent()), null !== callee)
          ) {
            callee = callee.block;
            hookCalls.has(callee) || hookCalls.set(callee, []);
            callee = hookCalls.get(callee);
            var key = "";
            "VariableDeclarator" === path.parent.type &&
              (key = path.parentPath.get("id").getSource());
            var args = path.get("arguments");
            "useState" === name && 0 < args.length
              ? (key += "(" + args[0].getSource() + ")")
              : "useReducer" === name &&
                1 < args.length &&
                (key += "(" + args[1].getSource() + ")");
            callee.push({ callee: path.node.callee, name: name, key: key });
          }
        }
      };
    return {
      visitor: {
        ExportDefaultDeclaration: function (path) {
          var node = path.node,
            decl = node.declaration,
            declPath = path.get("declaration");
          if (
            "CallExpression" === decl.type &&
            !seenForRegistration.has(node)
          ) {
            seenForRegistration.add(node);
            var programPath = path.parentPath;
            findInnerComponents(
              "%default%",
              declPath,
              function (persistentID, targetExpr, targetPath) {
                null !== targetPath &&
                  ((persistentID = createRegistration(
                    programPath,
                    persistentID
                  )),
                  targetPath.replaceWith(
                    t.assignmentExpression("=", persistentID, targetExpr)
                  ));
              }
            );
          }
        },
        FunctionDeclaration: {
          enter: function (path) {
            var node = path.node,
              modulePrefix = "";
            switch (path.parent.type) {
              case "Program":
                var insertAfterPath = path;
                var programPath = path.parentPath;
                break;
              case "TSModuleBlock":
                insertAfterPath = path;
                programPath = insertAfterPath.parentPath.parentPath;
                break;
              case "ExportNamedDeclaration":
                insertAfterPath = path.parentPath;
                programPath = insertAfterPath.parentPath;
                break;
              case "ExportDefaultDeclaration":
                insertAfterPath = path.parentPath;
                programPath = insertAfterPath.parentPath;
                break;
              default:
                return;
            }
            if (
              "TSModuleBlock" === path.parent.type ||
              "ExportNamedDeclaration" === path.parent.type
            )
              for (; "Program" !== programPath.type; ) {
                if ("TSModuleDeclaration" === programPath.type) {
                  if (
                    "Program" !== programPath.parentPath.type &&
                    "ExportNamedDeclaration" !== programPath.parentPath.type
                  )
                    return;
                  modulePrefix = programPath.node.id.name + "$" + modulePrefix;
                }
                programPath = programPath.parentPath;
              }
            var id = node.id;
            null !== id &&
              ((id = id.name),
              isComponentishName(id) &&
                !seenForRegistration.has(node) &&
                (seenForRegistration.add(node),
                findInnerComponents(
                  modulePrefix + id,
                  path,
                  function (persistentID, targetExpr) {
                    persistentID = createRegistration(
                      programPath,
                      persistentID
                    );
                    insertAfterPath.insertAfter(
                      t.expressionStatement(
                        t.assignmentExpression("=", persistentID, targetExpr)
                      )
                    );
                  }
                )));
          },
          exit: function (path) {
            var node = path.node,
              id = node.id;
            if (null !== id) {
              var signature = getHookCallsSignature(node);
              if (null !== signature && !seenForSignature.has(node)) {
                seenForSignature.add(node);
                node = path.scope.generateUidIdentifier("_s");
                path.scope.parent.push({
                  id: node,
                  init: t.callExpression(refreshSig, [])
                });
                path
                  .get("body")
                  .unshiftContainer(
                    "body",
                    t.expressionStatement(t.callExpression(node, []))
                  );
                var insertAfterPath = null;
                path.find(function (p) {
                  if (p.parentPath.isBlock()) return (insertAfterPath = p), !0;
                });
                null !== insertAfterPath &&
                  insertAfterPath.insertAfter(
                    t.expressionStatement(
                      t.callExpression(
                        node,
                        createArgumentsForSignature(
                          id,
                          signature,
                          insertAfterPath.scope
                        )
                      )
                    )
                  );
              }
            }
          }
        },
        "ArrowFunctionExpression|FunctionExpression": {
          exit: function (path) {
            var node = path.node,
              signature = getHookCallsSignature(node);
            if (null !== signature && !seenForSignature.has(node)) {
              seenForSignature.add(node);
              var sigCallID = path.scope.generateUidIdentifier("_s");
              path.scope.parent.push({
                id: sigCallID,
                init: t.callExpression(refreshSig, [])
              });
              "BlockStatement" !== path.node.body.type &&
                (path.node.body = t.blockStatement([
                  t.returnStatement(path.node.body)
                ]));
              path
                .get("body")
                .unshiftContainer(
                  "body",
                  t.expressionStatement(t.callExpression(sigCallID, []))
                );
              if ("VariableDeclarator" === path.parent.type) {
                var insertAfterPath = null;
                path.find(function (p) {
                  if (p.parentPath.isBlock()) return (insertAfterPath = p), !0;
                });
                null !== insertAfterPath &&
                  insertAfterPath.insertAfter(
                    t.expressionStatement(
                      t.callExpression(
                        sigCallID,
                        createArgumentsForSignature(
                          path.parent.id,
                          signature,
                          insertAfterPath.scope
                        )
                      )
                    )
                  );
              } else
                [path]
                  .concat(findHOCCallPathsAbove(path))
                  .forEach(function (p) {
                    p.replaceWith(
                      t.callExpression(
                        sigCallID,
                        createArgumentsForSignature(p.node, signature, p.scope)
                      )
                    );
                  });
            }
          }
        },
        VariableDeclaration: function (path) {
          var node = path.node,
            modulePrefix = "";
          switch (path.parent.type) {
            case "Program":
              var insertAfterPath = path;
              var programPath = path.parentPath;
              break;
            case "TSModuleBlock":
              insertAfterPath = path;
              programPath = insertAfterPath.parentPath.parentPath;
              break;
            case "ExportNamedDeclaration":
              insertAfterPath = path.parentPath;
              programPath = insertAfterPath.parentPath;
              break;
            case "ExportDefaultDeclaration":
              insertAfterPath = path.parentPath;
              programPath = insertAfterPath.parentPath;
              break;
            default:
              return;
          }
          if (
            "TSModuleBlock" === path.parent.type ||
            "ExportNamedDeclaration" === path.parent.type
          )
            for (; "Program" !== programPath.type; ) {
              if ("TSModuleDeclaration" === programPath.type) {
                if (
                  "Program" !== programPath.parentPath.type &&
                  "ExportNamedDeclaration" !== programPath.parentPath.type
                )
                  return;
                modulePrefix = programPath.node.id.name + "$" + modulePrefix;
              }
              programPath = programPath.parentPath;
            }
          if (
            !seenForRegistration.has(node) &&
            (seenForRegistration.add(node),
            (path = path.get("declarations")),
            1 === path.length)
          ) {
            var declPath = path[0];
            findInnerComponents(
              modulePrefix + declPath.node.id.name,
              declPath,
              function (persistentID, targetExpr, targetPath) {
                null !== targetPath &&
                  ((persistentID = createRegistration(
                    programPath,
                    persistentID
                  )),
                  "VariableDeclarator" === targetPath.parent.type
                    ? insertAfterPath.insertAfter(
                        t.expressionStatement(
                          t.assignmentExpression(
                            "=",
                            persistentID,
                            declPath.node.id
                          )
                        )
                      )
                    : targetPath.replaceWith(
                        t.assignmentExpression("=", persistentID, targetExpr)
                      ));
              }
            );
          }
        },
        Program: {
          enter: function (path) {
            path.traverse(HookCallsVisitor);
          },
          exit: function (path) {
            var registrations = registrationsByProgramPath.get(path);
            if (void 0 !== registrations) {
              var node = path.node;
              if (!seenForOutro.has(node)) {
                seenForOutro.add(node);
                registrationsByProgramPath.delete(path);
                var declarators = [];
                path.pushContainer(
                  "body",
                  t.variableDeclaration("var", declarators)
                );
                registrations.forEach(function (_ref) {
                  var handle = _ref.handle;
                  path.pushContainer(
                    "body",
                    t.expressionStatement(
                      t.callExpression(refreshReg, [
                        handle,
                        t.stringLiteral(_ref.persistentID)
                      ])
                    )
                  );
                  declarators.push(t.variableDeclarator(handle));
                });
              }
            }
          }
        }
      }
    };
  });
