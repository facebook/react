/**
 *
 * eslint-plugin-react-hooks.development.js
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
  (function () {
    function _unsupportedIterableToArray(o, minLen) {
      if (o) {
        if ("string" === typeof o) return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        "Object" === n && o.constructor && (n = o.constructor.name);
        if ("Map" === n || "Set" === n) return Array.from(o);
        if (
          "Arguments" === n ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
        )
          return _arrayLikeToArray(o, minLen);
      }
    }
    function _arrayLikeToArray(arr, len) {
      if (null == len || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it;
      if ("undefined" === typeof Symbol || null == o[Symbol.iterator]) {
        if (
          Array.isArray(o) ||
          (it = _unsupportedIterableToArray(o)) ||
          (allowArrayLike && o && "number" === typeof o.length)
        ) {
          it && (o = it);
          var i = 0;
          allowArrayLike = function () {};
          return {
            s: allowArrayLike,
            n: function () {
              return i >= o.length ? { done: !0 } : { done: !1, value: o[i++] };
            },
            e: function (e) {
              throw e;
            },
            f: allowArrayLike
          };
        }
        throw new TypeError(
          "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
        );
      }
      var normalCompletion = !0,
        didErr = !1,
        err;
      return {
        s: function () {
          it = o[Symbol.iterator]();
        },
        n: function () {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function (e) {
          didErr = !0;
          err = e;
        },
        f: function () {
          try {
            normalCompletion || null == it.return || it.return();
          } finally {
            if (didErr) throw err;
          }
        }
      };
    }
    function isHook(node) {
      if ("Identifier" === node.type)
        return (node = node.name), "use" === node || /^use[A-Z0-9]/.test(node);
      if (
        "MemberExpression" === node.type &&
        !node.computed &&
        isHook(node.property)
      ) {
        node = node.object;
        var isPascalCaseNameSpace = /^[A-Z].*/;
        return (
          "Identifier" === node.type && isPascalCaseNameSpace.test(node.name)
        );
      }
      return !1;
    }
    function isComponentName(node) {
      return "Identifier" === node.type && /^[A-Z]/.test(node.name);
    }
    function isReactFunction(node, functionName) {
      return (
        node.name === functionName ||
        ("MemberExpression" === node.type &&
          "React" === node.object.name &&
          node.property.name === functionName)
      );
    }
    function isForwardRefCallback(node) {
      return !!(
        node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, "forwardRef")
      );
    }
    function isMemoCallback(node) {
      return !!(
        node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, "memo")
      );
    }
    function isInsideComponentOrHook(node) {
      for (; node; ) {
        var functionName = getFunctionName(node);
        if (
          (functionName &&
            (isComponentName(functionName) || isHook(functionName))) ||
          isForwardRefCallback(node) ||
          isMemoCallback(node)
        )
          return !0;
        node = node.parent;
      }
      return !1;
    }
    function isUseEffectEventIdentifier$1(node) {
      return "Identifier" === node.type && "useEffectEvent" === node.name;
    }
    function getFunctionName(node) {
      if (
        "FunctionDeclaration" === node.type ||
        ("FunctionExpression" === node.type && node.id)
      )
        return node.id;
      if (
        "FunctionExpression" === node.type ||
        "ArrowFunctionExpression" === node.type
      )
        return "VariableDeclarator" === node.parent.type &&
          node.parent.init === node
          ? node.parent.id
          : "AssignmentExpression" === node.parent.type &&
              node.parent.right === node &&
              "=" === node.parent.operator
            ? node.parent.left
            : "Property" !== node.parent.type ||
                node.parent.value !== node ||
                node.parent.computed
              ? "AssignmentPattern" !== node.parent.type ||
                node.parent.right !== node ||
                node.parent.computed
                ? void 0
                : node.parent.left
              : node.parent.key;
    }
    function collectRecommendations(_ref6) {
      function createDepTree() {
        return {
          isUsed: !1,
          isSatisfiedRecursively: !1,
          isSubtreeUsed: !1,
          children: new Map()
        };
      }
      function getOrCreateNodeByPath(rootNode, path) {
        path = path.split(".");
        path = _createForOfIteratorHelper(path);
        var _step4;
        try {
          for (path.s(); !(_step4 = path.n()).done; ) {
            var key = _step4.value,
              child = rootNode.children.get(key);
            child ||
              ((child = createDepTree()), rootNode.children.set(key, child));
            rootNode = child;
          }
        } catch (err) {
          path.e(err);
        } finally {
          path.f();
        }
        return rootNode;
      }
      function markAllParentsByPath(rootNode, path, fn) {
        path = path.split(".");
        path = _createForOfIteratorHelper(path);
        var _step5;
        try {
          for (path.s(); !(_step5 = path.n()).done; ) {
            var child = rootNode.children.get(_step5.value);
            if (!child) break;
            fn(child);
            rootNode = child;
          }
        } catch (err) {
          path.e(err);
        } finally {
          path.f();
        }
      }
      function scanTreeRecursively(
        node,
        missingPaths,
        satisfyingPaths,
        keyToPath
      ) {
        node.children.forEach(function (child, key) {
          var path = keyToPath(key);
          child.isSatisfiedRecursively
            ? child.isSubtreeUsed && satisfyingPaths.add(path)
            : child.isUsed
              ? missingPaths.add(path)
              : scanTreeRecursively(
                  child,
                  missingPaths,
                  satisfyingPaths,
                  function (childKey) {
                    return path + "." + childKey;
                  }
                );
        });
      }
      var dependencies = _ref6.dependencies,
        declaredDependencies = _ref6.declaredDependencies,
        stableDependencies = _ref6.stableDependencies,
        externalDependencies = _ref6.externalDependencies,
        isEffect = _ref6.isEffect,
        depTree = createDepTree();
      dependencies.forEach(function (_, key) {
        getOrCreateNodeByPath(depTree, key).isUsed = !0;
        markAllParentsByPath(depTree, key, function (parent) {
          parent.isSubtreeUsed = !0;
        });
      });
      declaredDependencies.forEach(function (_ref7) {
        getOrCreateNodeByPath(depTree, _ref7.key).isSatisfiedRecursively = !0;
      });
      stableDependencies.forEach(function (key) {
        getOrCreateNodeByPath(depTree, key).isSatisfiedRecursively = !0;
      });
      _ref6 = new Set();
      var satisfyingDependencies = new Set();
      scanTreeRecursively(
        depTree,
        _ref6,
        satisfyingDependencies,
        function (key) {
          return key;
        }
      );
      var suggestedDependencies = [],
        unnecessaryDependencies = new Set(),
        duplicateDependencies = new Set();
      declaredDependencies.forEach(function (_ref8) {
        _ref8 = _ref8.key;
        satisfyingDependencies.has(_ref8)
          ? -1 === suggestedDependencies.indexOf(_ref8)
            ? suggestedDependencies.push(_ref8)
            : duplicateDependencies.add(_ref8)
          : !isEffect ||
              _ref8.endsWith(".current") ||
              externalDependencies.has(_ref8)
            ? unnecessaryDependencies.add(_ref8)
            : -1 === suggestedDependencies.indexOf(_ref8) &&
              suggestedDependencies.push(_ref8);
      });
      _ref6.forEach(function (key) {
        suggestedDependencies.push(key);
      });
      return {
        suggestedDependencies: suggestedDependencies,
        unnecessaryDependencies: unnecessaryDependencies,
        duplicateDependencies: duplicateDependencies,
        missingDependencies: _ref6
      };
    }
    function getConstructionExpressionType(node) {
      switch (node.type) {
        case "ObjectExpression":
          return "object";
        case "ArrayExpression":
          return "array";
        case "ArrowFunctionExpression":
        case "FunctionExpression":
          return "function";
        case "ClassExpression":
          return "class";
        case "ConditionalExpression":
          if (
            null != getConstructionExpressionType(node.consequent) ||
            null != getConstructionExpressionType(node.alternate)
          )
            return "conditional";
          break;
        case "LogicalExpression":
          if (
            null != getConstructionExpressionType(node.left) ||
            null != getConstructionExpressionType(node.right)
          )
            return "logical expression";
          break;
        case "JSXFragment":
          return "JSX fragment";
        case "JSXElement":
          return "JSX element";
        case "AssignmentExpression":
          if (null != getConstructionExpressionType(node.right))
            return "assignment expression";
          break;
        case "NewExpression":
          return "object construction";
        case "Literal":
          if (node.value instanceof RegExp) return "regular expression";
          break;
        case "TypeCastExpression":
        case "AsExpression":
        case "TSAsExpression":
          return getConstructionExpressionType(node.expression);
      }
      return null;
    }
    function scanForConstructions(_ref9) {
      var declaredDependenciesNode = _ref9.declaredDependenciesNode,
        componentScope = _ref9.componentScope,
        scope = _ref9.scope;
      return _ref9.declaredDependencies
        .map(function (_ref10) {
          var key = _ref10.key;
          _ref10 = componentScope.variables.find(function (v) {
            return v.name === key;
          });
          if (null == _ref10) return null;
          var node = _ref10.defs[0];
          if (null == node) return null;
          if (
            "Variable" === node.type &&
            "VariableDeclarator" === node.node.type &&
            "Identifier" === node.node.id.type &&
            null != node.node.init
          ) {
            var constantExpressionType = getConstructionExpressionType(
              node.node.init
            );
            if (null != constantExpressionType)
              return [_ref10, constantExpressionType];
          }
          return "FunctionName" === node.type &&
            "FunctionDeclaration" === node.node.type
            ? [_ref10, "function"]
            : "ClassName" === node.type && "ClassDeclaration" === node.node.type
              ? [_ref10, "class"]
              : null;
        })
        .filter(Boolean)
        .map(function (_ref11) {
          var ref = _ref11[0];
          _ref11 = _ref11[1];
          var JSCompiler_temp_const = ref.defs[0];
          a: {
            for (
              var foundWriteExpr = !1, i = 0;
              i < ref.references.length;
              i++
            ) {
              var reference = ref.references[i];
              if (reference.writeExpr)
                if (foundWriteExpr) {
                  ref = !0;
                  break a;
                } else {
                  foundWriteExpr = !0;
                  continue;
                }
              for (
                var currentScope = reference.from;
                currentScope !== scope && null != currentScope;

              )
                currentScope = currentScope.upper;
              if (
                currentScope !== scope &&
                !isAncestorNodeOf(
                  declaredDependenciesNode,
                  reference.identifier
                )
              ) {
                ref = !0;
                break a;
              }
            }
            ref = !1;
          }
          return {
            construction: JSCompiler_temp_const,
            depType: _ref11,
            isUsedOutsideOfHook: ref
          };
        });
    }
    function getDependency(node) {
      return ("MemberExpression" !== node.parent.type &&
        "OptionalMemberExpression" !== node.parent.type) ||
        node.parent.object !== node ||
        "current" === node.parent.property.name ||
        node.parent.computed ||
        (null != node.parent.parent &&
          ("CallExpression" === node.parent.parent.type ||
            "OptionalCallExpression" === node.parent.parent.type) &&
          node.parent.parent.callee === node.parent)
        ? "MemberExpression" === node.type &&
          node.parent &&
          "AssignmentExpression" === node.parent.type &&
          node.parent.left === node
          ? node.object
          : node
        : getDependency(node.parent);
    }
    function markNode(node, optionalChains, result) {
      optionalChains &&
        (node.optional
          ? optionalChains.has(result) || optionalChains.set(result, !0)
          : optionalChains.set(result, !1));
    }
    function analyzePropertyChain(node, optionalChains) {
      if ("Identifier" === node.type || "JSXIdentifier" === node.type)
        return (
          (node = node.name),
          optionalChains && optionalChains.set(node, !1),
          node
        );
      if ("MemberExpression" !== node.type || node.computed) {
        if ("OptionalMemberExpression" !== node.type || node.computed) {
          if ("ChainExpression" !== node.type || node.computed)
            throw Error("Unsupported node type: " + node.type);
          node = node.expression;
          if ("CallExpression" === node.type)
            throw Error("Unsupported node type: " + node.type);
          var _object2 = analyzePropertyChain(node.object, optionalChains),
            _property2 = analyzePropertyChain(node.property, null);
          _object2 = _object2 + "." + _property2;
          markNode(node, optionalChains, _object2);
          return _object2;
        }
        _object2 = analyzePropertyChain(node.object, optionalChains);
        _property2 = analyzePropertyChain(node.property, null);
        _object2 = _object2 + "." + _property2;
        markNode(node, optionalChains, _object2);
        return _object2;
      }
      _object2 = analyzePropertyChain(node.object, optionalChains);
      _property2 = analyzePropertyChain(node.property, null);
      _object2 = _object2 + "." + _property2;
      markNode(node, optionalChains, _object2);
      return _object2;
    }
    function getNodeWithoutReactNamespace(node) {
      return "MemberExpression" !== node.type ||
        "Identifier" !== node.object.type ||
        "React" !== node.object.name ||
        "Identifier" !== node.property.type ||
        node.computed
        ? node
        : node.property;
    }
    function getReactiveHookCallbackIndex(calleeNode, options) {
      var node = getNodeWithoutReactNamespace(calleeNode);
      if ("Identifier" !== node.type) return -1;
      switch (node.name) {
        case "useEffect":
        case "useLayoutEffect":
        case "useCallback":
        case "useMemo":
          return 0;
        case "useImperativeHandle":
          return 1;
        default:
          if (node === calleeNode && options && options.additionalHooks) {
            try {
              var name = analyzePropertyChain(node, null);
            } catch (error) {
              if (/Unsupported node type/.test(error.message)) return 0;
              throw error;
            }
            return options.additionalHooks.test(name) ? 0 : -1;
          }
          return -1;
      }
    }
    function fastFindReferenceWithParent(start, target) {
      for (var queue = [start], item = null; queue.length; ) {
        item = queue.shift();
        if (
          ("Identifier" === item.type || "JSXIdentifier" === item.type) &&
          item.type === target.type &&
          item.name === target.name &&
          item.range[0] === target.range[0] &&
          item.range[1] === target.range[1]
        )
          return item;
        if (isAncestorNodeOf(item, target)) {
          start = 0;
          for (
            var _Object$entries = Object.entries(item);
            start < _Object$entries.length;
            start++
          ) {
            var _Object$entries$_i = _Object$entries[start],
              value = _Object$entries$_i[1];
            "parent" !== _Object$entries$_i[0] &&
              (isNodeLike(value)
                ? ((value.parent = item), queue.push(value))
                : Array.isArray(value) &&
                  value.forEach(function (val) {
                    isNodeLike(val) && ((val.parent = item), queue.push(val));
                  }));
          }
        }
      }
      return null;
    }
    function joinEnglish(arr) {
      for (var s = "", i = 0; i < arr.length; i++)
        (s += arr[i]),
          0 === i && 2 === arr.length
            ? (s += " and ")
            : i === arr.length - 2 && 2 < arr.length
              ? (s += ", and ")
              : i < arr.length - 1 && (s += ", ");
      return s;
    }
    function isNodeLike(val) {
      return (
        "object" === typeof val &&
        null !== val &&
        !Array.isArray(val) &&
        "string" === typeof val.type
      );
    }
    function isAncestorNodeOf(a, b) {
      return a.range[0] <= b.range[0] && a.range[1] >= b.range[1];
    }
    exports.configs = {
      recommended: {
        plugins: ["react-hooks"],
        rules: {
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn"
        }
      }
    };
    exports.rules = {
      "rules-of-hooks": {
        meta: {
          type: "problem",
          docs: {
            description: "enforces the Rules of Hooks",
            recommended: !0,
            url: "https://reactjs.org/docs/hooks-rules.html"
          }
        },
        create: function (context) {
          function recordAllUseEffectEventFunctions(scope) {
            scope = _createForOfIteratorHelper(scope.references);
            var _step;
            try {
              for (scope.s(); !(_step = scope.n()).done; ) {
                var reference = _step.value,
                  parent = reference.identifier.parent;
                if (
                  "VariableDeclarator" === parent.type &&
                  parent.init &&
                  "CallExpression" === parent.init.type &&
                  parent.init.callee &&
                  isUseEffectEventIdentifier$1(parent.init.callee)
                ) {
                  var _iterator2 = _createForOfIteratorHelper(
                      reference.resolved.references
                    ),
                    _step2;
                  try {
                    for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                      var ref = _step2.value;
                      ref !== reference &&
                        useEffectEventFunctions.add(ref.identifier);
                    }
                  } catch (err) {
                    _iterator2.e(err);
                  } finally {
                    _iterator2.f();
                  }
                }
              }
            } catch (err$0) {
              scope.e(err$0);
            } finally {
              scope.f();
            }
          }
          var lastEffect = null,
            codePathReactHooksMapStack = [],
            codePathSegmentStack = [],
            useEffectEventFunctions = new WeakSet(),
            getSource =
              "function" === typeof context.getSource
                ? function (node) {
                    return context.getSource(node);
                  }
                : function (node) {
                    return context.sourceCode.getText(node);
                  },
            getScope =
              "function" === typeof context.getScope
                ? function () {
                    return context.getScope();
                  }
                : function (node) {
                    return context.sourceCode.getScope(node);
                  };
          return {
            onCodePathSegmentStart: function (segment) {
              return codePathSegmentStack.push(segment);
            },
            onCodePathSegmentEnd: function () {
              return codePathSegmentStack.pop();
            },
            onCodePathStart: function () {
              return codePathReactHooksMapStack.push(new Map());
            },
            onCodePathEnd: function (codePath, codePathNode) {
              function countPathsFromStart(segment, pathHistory) {
                var cache = countPathsFromStart.cache,
                  paths = cache.get(segment.id);
                pathHistory = new Set(pathHistory);
                if (pathHistory.has(segment.id)) {
                  cache = [].concat(pathHistory);
                  segment = cache.slice(cache.indexOf(segment.id) + 1);
                  segment = _createForOfIteratorHelper(segment);
                  var _step3;
                  try {
                    for (segment.s(); !(_step3 = segment.n()).done; )
                      cyclic.add(_step3.value);
                  } catch (err) {
                    segment.e(err);
                  } finally {
                    segment.f();
                  }
                  return BigInt("0");
                }
                pathHistory.add(segment.id);
                if (void 0 !== paths) return paths;
                if (codePath.thrownSegments.includes(segment))
                  paths = BigInt("0");
                else if (0 === segment.prevSegments.length) paths = BigInt("1");
                else {
                  paths = BigInt("0");
                  _step3 = _createForOfIteratorHelper(segment.prevSegments);
                  var _step4;
                  try {
                    for (_step3.s(); !(_step4 = _step3.n()).done; )
                      paths += countPathsFromStart(_step4.value, pathHistory);
                  } catch (err$1) {
                    _step3.e(err$1);
                  } finally {
                    _step3.f();
                  }
                }
                segment.reachable && paths === BigInt("0")
                  ? cache.delete(segment.id)
                  : cache.set(segment.id, paths);
                return paths;
              }
              function countPathsToEnd(segment, pathHistory) {
                var cache = countPathsToEnd.cache,
                  paths = cache.get(segment.id);
                pathHistory = new Set(pathHistory);
                if (pathHistory.has(segment.id)) {
                  cache = Array.from(pathHistory);
                  segment = cache.slice(cache.indexOf(segment.id) + 1);
                  segment = _createForOfIteratorHelper(segment);
                  var _step5;
                  try {
                    for (segment.s(); !(_step5 = segment.n()).done; )
                      cyclic.add(_step5.value);
                  } catch (err) {
                    segment.e(err);
                  } finally {
                    segment.f();
                  }
                  return BigInt("0");
                }
                pathHistory.add(segment.id);
                if (void 0 !== paths) return paths;
                if (codePath.thrownSegments.includes(segment))
                  paths = BigInt("0");
                else if (0 === segment.nextSegments.length) paths = BigInt("1");
                else {
                  paths = BigInt("0");
                  _step5 = _createForOfIteratorHelper(segment.nextSegments);
                  var _step6;
                  try {
                    for (_step5.s(); !(_step6 = _step5.n()).done; )
                      paths += countPathsToEnd(_step6.value, pathHistory);
                  } catch (err$2) {
                    _step5.e(err$2);
                  } finally {
                    _step5.f();
                  }
                }
                cache.set(segment.id, paths);
                return paths;
              }
              function shortestPathLengthToStart(segment) {
                var cache = shortestPathLengthToStart.cache,
                  length = cache.get(segment.id);
                if (null === length) return Infinity;
                if (void 0 !== length) return length;
                cache.set(segment.id, null);
                if (0 === segment.prevSegments.length) length = 1;
                else {
                  length = Infinity;
                  var _iterator7 = _createForOfIteratorHelper(
                      segment.prevSegments
                    ),
                    _step7;
                  try {
                    for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
                      var prevLength = shortestPathLengthToStart(_step7.value);
                      prevLength < length && (length = prevLength);
                    }
                  } catch (err) {
                    _iterator7.e(err);
                  } finally {
                    _iterator7.f();
                  }
                  length += 1;
                }
                cache.set(segment.id, length);
                return length;
              }
              var reactHooksMap = codePathReactHooksMapStack.pop();
              if (0 !== reactHooksMap.size) {
                var cyclic = new Set();
                countPathsFromStart.cache = new Map();
                countPathsToEnd.cache = new Map();
                shortestPathLengthToStart.cache = new Map();
                var allPathsFromStartToEnd = countPathsToEnd(
                    codePath.initialSegment
                  ),
                  codePathFunctionName = getFunctionName(codePathNode),
                  isSomewhereInsideComponentOrHook =
                    isInsideComponentOrHook(codePathNode),
                  isDirectlyInsideComponentOrHook = codePathFunctionName
                    ? isComponentName(codePathFunctionName) ||
                      isHook(codePathFunctionName)
                    : isForwardRefCallback(codePathNode) ||
                      isMemoCallback(codePathNode),
                  shortestFinalPathLength = Infinity,
                  _iterator8 = _createForOfIteratorHelper(
                    codePath.finalSegments
                  ),
                  _step8;
                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
                    var finalSegment = _step8.value;
                    if (finalSegment.reachable) {
                      var length$jscomp$0 =
                        shortestPathLengthToStart(finalSegment);
                      length$jscomp$0 < shortestFinalPathLength &&
                        (shortestFinalPathLength = length$jscomp$0);
                    }
                  }
                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }
                reactHooksMap = _createForOfIteratorHelper(reactHooksMap);
                var _step9;
                try {
                  for (
                    reactHooksMap.s();
                    !(_step9 = reactHooksMap.n()).done;

                  ) {
                    var _step9$value = _step9.value,
                      segment$jscomp$0 = _step9$value[0],
                      reactHooks = _step9$value[1];
                    if (segment$jscomp$0.reachable) {
                      var possiblyHasEarlyReturn =
                          0 === segment$jscomp$0.nextSegments.length
                            ? shortestFinalPathLength <=
                              shortestPathLengthToStart(segment$jscomp$0)
                            : shortestFinalPathLength <
                              shortestPathLengthToStart(segment$jscomp$0),
                        pathsFromStartToEnd =
                          countPathsFromStart(segment$jscomp$0) *
                          countPathsToEnd(segment$jscomp$0),
                        cycled = cyclic.has(segment$jscomp$0.id),
                        _iterator10 = _createForOfIteratorHelper(reactHooks),
                        _step10;
                      try {
                        for (
                          _iterator10.s();
                          !(_step10 = _iterator10.n()).done;

                        ) {
                          var hook = _step10.value;
                          cycled &&
                            !isReactFunction(hook, "use") &&
                            context.report({
                              node: hook,
                              message:
                                'React Hook "' +
                                getSource(hook) +
                                '" may be executed more than once. Possibly because it is called in a loop. React Hooks must be called in the exact same order in every component render.'
                            });
                          if (isDirectlyInsideComponentOrHook) {
                            if (
                              (codePathNode.async &&
                                context.report({
                                  node: hook,
                                  message:
                                    'React Hook "' +
                                    getSource(hook) +
                                    '" cannot be called in an async function.'
                                }),
                              !cycled &&
                                pathsFromStartToEnd !==
                                  allPathsFromStartToEnd &&
                                !isReactFunction(hook, "use"))
                            ) {
                              var message =
                                'React Hook "' +
                                getSource(hook) +
                                '" is called conditionally. React Hooks must be called in the exact same order in every component render.' +
                                (possiblyHasEarlyReturn
                                  ? " Did you accidentally call a React Hook after an early return?"
                                  : "");
                              context.report({ node: hook, message: message });
                            }
                          } else if (
                            codePathNode.parent &&
                            ("MethodDefinition" === codePathNode.parent.type ||
                              "ClassProperty" === codePathNode.parent.type) &&
                            codePathNode.parent.value === codePathNode
                          ) {
                            var _message =
                              'React Hook "' +
                              getSource(hook) +
                              '" cannot be called in a class component. React Hooks must be called in a React function component or a custom React Hook function.';
                            context.report({ node: hook, message: _message });
                          } else if (codePathFunctionName) {
                            var _message2 =
                              'React Hook "' +
                              getSource(hook) +
                              '" is called in function "' +
                              (getSource(codePathFunctionName) +
                                '" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".');
                            context.report({ node: hook, message: _message2 });
                          } else if ("Program" === codePathNode.type) {
                            var _message3 =
                              'React Hook "' +
                              getSource(hook) +
                              '" cannot be called at the top level. React Hooks must be called in a React function component or a custom React Hook function.';
                            context.report({ node: hook, message: _message3 });
                          } else if (
                            isSomewhereInsideComponentOrHook &&
                            !isReactFunction(hook, "use")
                          ) {
                            var _message4 =
                              'React Hook "' +
                              getSource(hook) +
                              '" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.';
                            context.report({ node: hook, message: _message4 });
                          }
                        }
                      } catch (err$3) {
                        _iterator10.e(err$3);
                      } finally {
                        _iterator10.f();
                      }
                    }
                  }
                } catch (err$4) {
                  reactHooksMap.e(err$4);
                } finally {
                  reactHooksMap.f();
                }
              }
            },
            CallExpression: function (node) {
              if (isHook(node.callee)) {
                var reactHooksMap =
                    codePathReactHooksMapStack[
                      codePathReactHooksMapStack.length - 1
                    ],
                  codePathSegment =
                    codePathSegmentStack[codePathSegmentStack.length - 1],
                  reactHooks = reactHooksMap.get(codePathSegment);
                reactHooks ||
                  ((reactHooks = []),
                  reactHooksMap.set(codePathSegment, reactHooks));
                reactHooks.push(node.callee);
              }
              "Identifier" === node.callee.type &&
                ("useEffect" === node.callee.name ||
                  isUseEffectEventIdentifier$1(node.callee)) &&
                0 < node.arguments.length &&
                (lastEffect = node);
            },
            Identifier: function (node) {
              null == lastEffect &&
                useEffectEventFunctions.has(node) &&
                "CallExpression" !== node.parent.type &&
                context.report({
                  node: node,
                  message:
                    "`" +
                    getSource(node) +
                    '` is a function created with React Hook "useEffectEvent", and can only be called from the same component. They cannot be assigned to variables or passed down.'
                });
            },
            "CallExpression:exit": function (node) {
              node === lastEffect && (lastEffect = null);
            },
            FunctionDeclaration: function (node) {
              isInsideComponentOrHook(node) &&
                recordAllUseEffectEventFunctions(getScope(node));
            },
            ArrowFunctionExpression: function (node) {
              isInsideComponentOrHook(node) &&
                recordAllUseEffectEventFunctions(getScope(node));
            }
          };
        }
      },
      "exhaustive-deps": {
        meta: {
          type: "suggestion",
          docs: {
            description:
              "verifies the list of dependencies for Hooks like useEffect and similar",
            recommended: !0,
            url: "https://github.com/facebook/react/issues/14920"
          },
          fixable: "code",
          hasSuggestions: !0,
          schema: [
            {
              type: "object",
              additionalProperties: !1,
              enableDangerousAutofixThisMayCauseInfiniteLoops: !1,
              properties: {
                additionalHooks: { type: "string" },
                enableDangerousAutofixThisMayCauseInfiniteLoops: {
                  type: "boolean"
                }
              }
            }
          ]
        },
        create: function (context) {
          function reportProblem(problem) {
            enableDangerousAutofixThisMayCauseInfiniteLoops &&
              Array.isArray(problem.suggest) &&
              0 < problem.suggest.length &&
              (problem.fix = problem.suggest[0].fix);
            context.report(problem);
          }
          function memoizeWithWeakMap(fn, map) {
            return function (arg) {
              if (map.has(arg)) return map.get(arg);
              var result = fn(arg);
              map.set(arg, result);
              return result;
            };
          }
          function visitFunctionWithDependencies(
            node,
            declaredDependenciesNode,
            reactiveHook,
            reactiveHookName,
            isEffect
          ) {
            function gatherDependenciesRecursively(currentScope) {
              var _iterator2 = _createForOfIteratorHelper(
                  currentScope.references
                ),
                _step2;
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                  var reference = _step2.value;
                  if (
                    reference.resolved &&
                    pureScopes.has(reference.resolved.scope)
                  ) {
                    var referenceNode = fastFindReferenceWithParent(
                        node,
                        reference.identifier
                      ),
                      dependencyNode = getDependency(referenceNode),
                      dependency = analyzePropertyChain(
                        dependencyNode,
                        optionalChains
                      ),
                      JSCompiler_temp;
                    if (
                      (JSCompiler_temp =
                        isEffect &&
                        "Identifier" === dependencyNode.type &&
                        ("MemberExpression" === dependencyNode.parent.type ||
                          "OptionalMemberExpression" ===
                            dependencyNode.parent.type) &&
                        !dependencyNode.parent.computed &&
                        "Identifier" === dependencyNode.parent.property.type &&
                        "current" === dependencyNode.parent.property.name)
                    ) {
                      for (
                        var curScope = reference.from,
                          isInReturnedFunction = !1;
                        curScope.block !== node;

                      )
                        "function" === curScope.type &&
                          (isInReturnedFunction =
                            null != curScope.block.parent &&
                            "ReturnStatement" === curScope.block.parent.type),
                          (curScope = curScope.upper);
                      JSCompiler_temp = isInReturnedFunction;
                    }
                    JSCompiler_temp &&
                      currentRefsInEffectCleanup.set(dependency, {
                        reference: reference,
                        dependencyNode: dependencyNode
                      });
                    if (
                      "TSTypeQuery" !== dependencyNode.parent.type &&
                      "TSTypeReference" !== dependencyNode.parent.type
                    ) {
                      var def = reference.resolved.defs[0];
                      if (
                        null != def &&
                        (null == def.node || def.node.init !== node.parent) &&
                        "TypeParameter" !== def.type
                      )
                        if (dependencies.has(dependency))
                          dependencies
                            .get(dependency)
                            .references.push(reference);
                        else {
                          var resolved = reference.resolved,
                            isStable =
                              memoizedIsStableKnownHookValue(resolved) ||
                              memoizedIsFunctionWithoutCapturedValues(resolved);
                          dependencies.set(dependency, {
                            isStable: isStable,
                            references: [reference]
                          });
                        }
                    }
                  }
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              currentScope = _createForOfIteratorHelper(
                currentScope.childScopes
              );
              var _step3;
              try {
                for (currentScope.s(); !(_step3 = currentScope.n()).done; )
                  gatherDependenciesRecursively(_step3.value);
              } catch (err$5) {
                currentScope.e(err$5);
              } finally {
                currentScope.f();
              }
            }
            function formatDependency(path) {
              path = path.split(".");
              for (var finalPath = "", i = 0; i < path.length; i++) {
                if (0 !== i) {
                  var pathSoFar = path.slice(0, i + 1).join(".");
                  pathSoFar = !0 === optionalChains.get(pathSoFar);
                  finalPath += pathSoFar ? "?." : ".";
                }
                finalPath += path[i];
              }
              return finalPath;
            }
            function getWarningMessage(deps, singlePrefix, label, fixVerb) {
              return 0 === deps.size
                ? null
                : (1 < deps.size ? "" : singlePrefix + " ") +
                    label +
                    " " +
                    (1 < deps.size ? "dependencies" : "dependency") +
                    ": " +
                    joinEnglish(
                      Array.from(deps)
                        .sort()
                        .map(function (name) {
                          return "'" + formatDependency(name) + "'";
                        })
                    ) +
                    (". Either " +
                      fixVerb +
                      " " +
                      (1 < deps.size ? "them" : "it") +
                      " or remove the dependency array.");
            }
            isEffect &&
              node.async &&
              reportProblem({
                node: node,
                message:
                  "Effect callbacks are synchronous to prevent race conditions. Put the async function inside:\n\nuseEffect(() => {\n  async function fetchData() {\n    // You can await here\n    const response = await MyAPI.getData(someId);\n    // ...\n  }\n  fetchData();\n}, [someId]); // Or [] if effect doesn't need props or state\n\nLearn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching"
              });
            for (
              var scope = scopeManager.acquire(node),
                pureScopes = new Set(),
                componentScope = null,
                currentScope = scope.upper;
              currentScope;

            ) {
              pureScopes.add(currentScope);
              if ("function" === currentScope.type) break;
              currentScope = currentScope.upper;
            }
            if (currentScope) {
              componentScope = currentScope;
              var isArray = Array.isArray,
                memoizedIsStableKnownHookValue = memoizeWithWeakMap(function (
                  resolved
                ) {
                  if (!isArray(resolved.defs)) return !1;
                  var def = resolved.defs[0];
                  if (null == def || "VariableDeclarator" !== def.node.type)
                    return !1;
                  var init = def.node.init;
                  if (null == init) return !1;
                  for (
                    ;
                    "TSAsExpression" === init.type ||
                    "AsExpression" === init.type;

                  )
                    init = init.expression;
                  var declaration = def.node.parent;
                  if (
                    null == declaration &&
                    (fastFindReferenceWithParent(
                      componentScope.block,
                      def.node.id
                    ),
                    (declaration = def.node.parent),
                    null == declaration)
                  )
                    return !1;
                  if (
                    "const" === declaration.kind &&
                    "Literal" === init.type &&
                    ("string" === typeof init.value ||
                      "number" === typeof init.value ||
                      null === init.value)
                  )
                    return !0;
                  if ("CallExpression" !== init.type) return !1;
                  init = init.callee;
                  "MemberExpression" !== init.type ||
                    "React" !== init.object.name ||
                    null == init.property ||
                    init.computed ||
                    (init = init.property);
                  if ("Identifier" !== init.type) return !1;
                  def = def.node.id;
                  declaration = init.name;
                  if ("useRef" === declaration && "Identifier" === def.type)
                    return !0;
                  init =
                    "Identifier" === init.type &&
                    "useEffectEvent" === init.name;
                  if (init && "Identifier" === def.type) {
                    resolved = _createForOfIteratorHelper(resolved.references);
                    var _step;
                    try {
                      for (resolved.s(); !(_step = resolved.n()).done; ) {
                        var ref = _step.value;
                        ref !== def &&
                          useEffectEventVariables.add(ref.identifier);
                      }
                    } catch (err) {
                      resolved.e(err);
                    } finally {
                      resolved.f();
                    }
                    return !0;
                  }
                  if (
                    "useState" === declaration ||
                    "useReducer" === declaration ||
                    "useActionState" === declaration
                  ) {
                    if (
                      "ArrayPattern" === def.type &&
                      2 === def.elements.length &&
                      isArray(resolved.identifiers)
                    ) {
                      if (def.elements[1] === resolved.identifiers[0]) {
                        if ("useState" === declaration)
                          for (
                            _step = resolved.references, resolved = ref = 0;
                            resolved < _step.length;
                            resolved++
                          ) {
                            _step[resolved].isWrite() && ref++;
                            if (1 < ref) return !1;
                            setStateCallSites.set(
                              _step[resolved].identifier,
                              def.elements[0]
                            );
                          }
                        return !0;
                      }
                      if (
                        def.elements[0] === resolved.identifiers[0] &&
                        "useState" === declaration
                      )
                        for (
                          def = resolved.references, _step = 0;
                          _step < def.length;
                          _step++
                        )
                          stateVariables.add(def[_step].identifier);
                    }
                  } else if (
                    "useTransition" === declaration &&
                    "ArrayPattern" === def.type &&
                    2 === def.elements.length &&
                    Array.isArray(resolved.identifiers) &&
                    def.elements[1] === resolved.identifiers[0]
                  )
                    return !0;
                  return !1;
                }, stableKnownValueCache),
                memoizedIsFunctionWithoutCapturedValues = memoizeWithWeakMap(
                  function (resolved) {
                    if (!isArray(resolved.defs)) return !1;
                    resolved = resolved.defs[0];
                    if (
                      null == resolved ||
                      null == resolved.node ||
                      null == resolved.node.id
                    )
                      return !1;
                    var fnNode = resolved.node,
                      childScopes = componentScope.childScopes;
                    resolved = null;
                    var i;
                    for (i = 0; i < childScopes.length; i++) {
                      var childScope = childScopes[i],
                        childScopeBlock = childScope.block;
                      if (
                        ("FunctionDeclaration" === fnNode.type &&
                          childScopeBlock === fnNode) ||
                        ("VariableDeclarator" === fnNode.type &&
                          childScopeBlock.parent === fnNode)
                      ) {
                        resolved = childScope;
                        break;
                      }
                    }
                    if (null == resolved) return !1;
                    for (i = 0; i < resolved.through.length; i++)
                      if (
                        ((fnNode = resolved.through[i]),
                        null != fnNode.resolved &&
                          pureScopes.has(fnNode.resolved.scope) &&
                          !memoizedIsStableKnownHookValue(fnNode.resolved))
                      )
                        return !1;
                    return !0;
                  },
                  functionWithoutCapturedValueCache
                ),
                currentRefsInEffectCleanup = new Map(),
                dependencies = new Map(),
                optionalChains = new Map();
              gatherDependenciesRecursively(scope);
              currentRefsInEffectCleanup.forEach(function (_ref, dependency) {
                var dependencyNode = _ref.dependencyNode;
                _ref = _ref.reference.resolved.references;
                for (
                  var foundCurrentAssignment = !1, i = 0;
                  i < _ref.length;
                  i++
                ) {
                  var parent = _ref[i].identifier.parent;
                  if (
                    null != parent &&
                    "MemberExpression" === parent.type &&
                    !parent.computed &&
                    "Identifier" === parent.property.type &&
                    "current" === parent.property.name &&
                    "AssignmentExpression" === parent.parent.type &&
                    parent.parent.left === parent
                  ) {
                    foundCurrentAssignment = !0;
                    break;
                  }
                }
                foundCurrentAssignment ||
                  reportProblem({
                    node: dependencyNode.parent.property,
                    message:
                      "The ref value '" +
                      dependency +
                      ".current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy '" +
                      (dependency +
                        ".current' to a variable inside the effect, and use that variable in the cleanup function.")
                  });
              });
              var staleAssignments = new Set(),
                stableDependencies = new Set();
              dependencies.forEach(function (_ref2, key) {
                var references = _ref2.references;
                _ref2.isStable && stableDependencies.add(key);
                references.forEach(function (reference) {
                  reference.writeExpr &&
                    ((reference = reference.writeExpr),
                    staleAssignments.has(key) ||
                      (staleAssignments.add(key),
                      reportProblem({
                        node: reference,
                        message:
                          "Assignments to the '" +
                          key +
                          "' variable from inside React Hook " +
                          (getSource(reactiveHook) +
                            " will be lost after each render. To preserve the value over time, store it in a useRef Hook and keep the mutable value in the '.current' property. Otherwise, you can move this variable directly inside ") +
                          (getSource(reactiveHook) + ".")
                      })));
                });
              });
              if (!(0 < staleAssignments.size))
                if (declaredDependenciesNode) {
                  var declaredDependencies = [],
                    externalDependencies = new Set();
                  currentScope =
                    "TSAsExpression" === declaredDependenciesNode.type &&
                    "ArrayExpression" ===
                      declaredDependenciesNode.expression.type;
                  "ArrayExpression" === declaredDependenciesNode.type ||
                  currentScope
                    ? (currentScope
                        ? declaredDependenciesNode.expression
                        : declaredDependenciesNode
                      ).elements.forEach(function (declaredDependencyNode) {
                        if (null !== declaredDependencyNode)
                          if ("SpreadElement" === declaredDependencyNode.type)
                            reportProblem({
                              node: declaredDependencyNode,
                              message:
                                "React Hook " +
                                getSource(reactiveHook) +
                                " has a spread element in its dependency array. This means we can't statically verify whether you've passed the correct dependencies."
                            });
                          else {
                            useEffectEventVariables.has(
                              declaredDependencyNode
                            ) &&
                              reportProblem({
                                node: declaredDependencyNode,
                                message:
                                  "Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `" +
                                  (getSource(declaredDependencyNode) +
                                    "` from the list."),
                                suggest: [
                                  {
                                    desc:
                                      "Remove the dependency `" +
                                      getSource(declaredDependencyNode) +
                                      "`",
                                    fix: function (fixer) {
                                      return fixer.removeRange(
                                        declaredDependencyNode.range
                                      );
                                    }
                                  }
                                ]
                              });
                            try {
                              var declaredDependency = analyzePropertyChain(
                                declaredDependencyNode,
                                null
                              );
                            } catch (error) {
                              if (/Unsupported node type/.test(error.message)) {
                                "Literal" === declaredDependencyNode.type
                                  ? dependencies.has(
                                      declaredDependencyNode.value
                                    )
                                    ? reportProblem({
                                        node: declaredDependencyNode,
                                        message:
                                          "The " +
                                          declaredDependencyNode.raw +
                                          " literal is not a valid dependency because it never changes. Did you mean to include " +
                                          (declaredDependencyNode.value +
                                            " in the array instead?")
                                      })
                                    : reportProblem({
                                        node: declaredDependencyNode,
                                        message:
                                          "The " +
                                          declaredDependencyNode.raw +
                                          " literal is not a valid dependency because it never changes. You can safely remove it."
                                      })
                                  : reportProblem({
                                      node: declaredDependencyNode,
                                      message:
                                        "React Hook " +
                                        getSource(reactiveHook) +
                                        " has a complex expression in the dependency array. Extract it to a separate variable so it can be statically checked."
                                    });
                                return;
                              }
                              throw error;
                            }
                            for (
                              var maybeID = declaredDependencyNode;
                              "MemberExpression" === maybeID.type ||
                              "OptionalMemberExpression" === maybeID.type ||
                              "ChainExpression" === maybeID.type;

                            )
                              maybeID =
                                maybeID.object || maybeID.expression.object;
                            var isDeclaredInComponent =
                              !componentScope.through.some(function (ref) {
                                return ref.identifier === maybeID;
                              });
                            declaredDependencies.push({
                              key: declaredDependency,
                              node: declaredDependencyNode
                            });
                            isDeclaredInComponent ||
                              externalDependencies.add(declaredDependency);
                          }
                      })
                    : reportProblem({
                        node: declaredDependenciesNode,
                        message:
                          "React Hook " +
                          getSource(reactiveHook) +
                          " was passed a dependency list that is not an array literal. This means we can't statically verify whether you've passed the correct dependencies."
                      });
                  var _collectRecommendatio2 = collectRecommendations({
                    dependencies: dependencies,
                    declaredDependencies: declaredDependencies,
                    stableDependencies: stableDependencies,
                    externalDependencies: externalDependencies,
                    isEffect: isEffect
                  });
                  currentScope = _collectRecommendatio2.unnecessaryDependencies;
                  var missingDependencies =
                      _collectRecommendatio2.missingDependencies,
                    duplicateDependencies =
                      _collectRecommendatio2.duplicateDependencies,
                    suggestedDeps =
                      _collectRecommendatio2.suggestedDependencies;
                  if (
                    0 ===
                    duplicateDependencies.size +
                      missingDependencies.size +
                      currentScope.size
                  )
                    scanForConstructions({
                      declaredDependencies: declaredDependencies,
                      declaredDependenciesNode: declaredDependenciesNode,
                      componentScope: componentScope,
                      scope: scope
                    }).forEach(function (_ref4) {
                      var construction = _ref4.construction,
                        isUsedOutsideOfHook = _ref4.isUsedOutsideOfHook;
                      _ref4 = _ref4.depType;
                      var wrapperHook =
                          "function" === _ref4 ? "useCallback" : "useMemo",
                        constructionType =
                          "function" === _ref4
                            ? "definition"
                            : "initialization",
                        defaultAdvice =
                          "wrap the " +
                          constructionType +
                          " of '" +
                          construction.name.name +
                          "' in its own " +
                          wrapperHook +
                          "() Hook.";
                      defaultAdvice =
                        "The '" +
                        construction.name.name +
                        "' " +
                        _ref4 +
                        " " +
                        ("conditional" === _ref4 ||
                        "logical expression" === _ref4
                          ? "could make"
                          : "makes") +
                        " the dependencies of " +
                        (reactiveHookName +
                          " Hook (at line " +
                          declaredDependenciesNode.loc.start.line +
                          ") change on every render. ") +
                        (isUsedOutsideOfHook
                          ? "To fix this, " + defaultAdvice
                          : "Move it inside the " +
                            reactiveHookName +
                            " callback. Alternatively, " +
                            defaultAdvice);
                      var suggest;
                      isUsedOutsideOfHook &&
                        "Variable" === construction.type &&
                        "function" === _ref4 &&
                        (suggest = [
                          {
                            desc:
                              "Wrap the " +
                              constructionType +
                              " of '" +
                              construction.name.name +
                              "' in its own " +
                              wrapperHook +
                              "() Hook.",
                            fix: function (fixer) {
                              var _ref5 =
                                  "useMemo" === wrapperHook
                                    ? ["useMemo(() => { return ", "; })"]
                                    : ["useCallback(", ")"],
                                after = _ref5[1];
                              return [
                                fixer.insertTextBefore(
                                  construction.node.init,
                                  _ref5[0]
                                ),
                                fixer.insertTextAfter(
                                  construction.node.init,
                                  after
                                )
                              ];
                            }
                          }
                        ]);
                      reportProblem({
                        node: construction.node,
                        message: defaultAdvice,
                        suggest: suggest
                      });
                    });
                  else {
                    !isEffect &&
                      0 < missingDependencies.size &&
                      (suggestedDeps = collectRecommendations({
                        dependencies: dependencies,
                        declaredDependencies: [],
                        stableDependencies: stableDependencies,
                        externalDependencies: externalDependencies,
                        isEffect: isEffect
                      }).suggestedDependencies);
                    (function () {
                      if (0 === declaredDependencies.length) return !0;
                      var declaredDepKeys = declaredDependencies.map(
                          function (dep) {
                            return dep.key;
                          }
                        ),
                        sortedDeclaredDepKeys = declaredDepKeys.slice().sort();
                      return (
                        declaredDepKeys.join(",") ===
                        sortedDeclaredDepKeys.join(",")
                      );
                    })() && suggestedDeps.sort();
                    _collectRecommendatio2 = "";
                    if (0 < currentScope.size) {
                      var badRef = null;
                      Array.from(currentScope.keys()).forEach(function (key) {
                        null === badRef &&
                          key.endsWith(".current") &&
                          (badRef = key);
                      });
                      if (null !== badRef)
                        _collectRecommendatio2 =
                          " Mutable values like '" +
                          badRef +
                          "' aren't valid dependencies because mutating them doesn't re-render the component.";
                      else if (0 < externalDependencies.size) {
                        var dep = Array.from(externalDependencies)[0];
                        scope.set.has(dep) ||
                          (_collectRecommendatio2 =
                            " Outer scope values like '" +
                            dep +
                            "' aren't valid dependencies because mutating them doesn't re-render the component.");
                      }
                    }
                    if (
                      !_collectRecommendatio2 &&
                      missingDependencies.has("props")
                    ) {
                      scope = dependencies.get("props");
                      if (null == scope) return;
                      scope = scope.references;
                      if (!Array.isArray(scope)) return;
                      dep = !0;
                      for (
                        var i$jscomp$0 = 0;
                        i$jscomp$0 < scope.length;
                        i$jscomp$0++
                      ) {
                        var id = fastFindReferenceWithParent(
                          componentScope.block,
                          scope[i$jscomp$0].identifier
                        );
                        if (!id) {
                          dep = !1;
                          break;
                        }
                        id = id.parent;
                        if (null == id) {
                          dep = !1;
                          break;
                        }
                        if (
                          "MemberExpression" !== id.type &&
                          "OptionalMemberExpression" !== id.type
                        ) {
                          dep = !1;
                          break;
                        }
                      }
                      dep &&
                        (_collectRecommendatio2 =
                          " However, 'props' will change when *any* prop changes, so the preferred fix is to destructure the 'props' object outside of the " +
                          (reactiveHookName +
                            " call and refer to those specific props inside ") +
                          (getSource(reactiveHook) + "."));
                    }
                    if (
                      !_collectRecommendatio2 &&
                      0 < missingDependencies.size
                    ) {
                      var missingCallbackDep = null;
                      missingDependencies.forEach(function (missingDep) {
                        if (!missingCallbackDep) {
                          var topScopeRef = componentScope.set.get(missingDep),
                            usedDep = dependencies.get(missingDep);
                          if (
                            usedDep.references[0].resolved === topScopeRef &&
                            ((topScopeRef = topScopeRef.defs[0]),
                            null != topScopeRef &&
                              null != topScopeRef.name &&
                              "Parameter" === topScopeRef.type)
                          ) {
                            topScopeRef = !1;
                            for (
                              var id, _i2 = 0;
                              _i2 < usedDep.references.length;
                              _i2++
                            )
                              if (
                                ((id = usedDep.references[_i2].identifier),
                                null != id &&
                                  null != id.parent &&
                                  ("CallExpression" === id.parent.type ||
                                    "OptionalCallExpression" ===
                                      id.parent.type) &&
                                  id.parent.callee === id)
                              ) {
                                topScopeRef = !0;
                                break;
                              }
                            topScopeRef && (missingCallbackDep = missingDep);
                          }
                        }
                      });
                      null !== missingCallbackDep &&
                        (_collectRecommendatio2 =
                          " If '" +
                          missingCallbackDep +
                          "' changes too often, find the parent component that defines it and wrap that definition in useCallback.");
                    }
                    if (
                      !_collectRecommendatio2 &&
                      0 < missingDependencies.size
                    ) {
                      var setStateRecommendation = null;
                      missingDependencies.forEach(function (missingDep) {
                        if (null === setStateRecommendation)
                          for (
                            var references =
                                dependencies.get(missingDep).references,
                              id,
                              maybeCall,
                              _i3 = 0;
                            _i3 < references.length;
                            _i3++
                          ) {
                            id = references[_i3].identifier;
                            for (
                              maybeCall = id.parent;
                              null != maybeCall &&
                              maybeCall !== componentScope.block;

                            ) {
                              if ("CallExpression" === maybeCall.type) {
                                var correspondingStateVariable =
                                  setStateCallSites.get(maybeCall.callee);
                                if (null != correspondingStateVariable) {
                                  correspondingStateVariable.name === missingDep
                                    ? (setStateRecommendation = {
                                        missingDep: missingDep,
                                        setter: maybeCall.callee.name,
                                        form: "updater"
                                      })
                                    : stateVariables.has(id)
                                      ? (setStateRecommendation = {
                                          missingDep: missingDep,
                                          setter: maybeCall.callee.name,
                                          form: "reducer"
                                        })
                                      : ((id = references[_i3].resolved),
                                        null != id &&
                                          ((id = id.defs[0]),
                                          null != id &&
                                            "Parameter" === id.type &&
                                            (setStateRecommendation = {
                                              missingDep: missingDep,
                                              setter: maybeCall.callee.name,
                                              form: "inlineReducer"
                                            })));
                                  break;
                                }
                              }
                              maybeCall = maybeCall.parent;
                            }
                            if (null !== setStateRecommendation) break;
                          }
                      });
                      if (null !== setStateRecommendation)
                        switch (setStateRecommendation.form) {
                          case "reducer":
                            _collectRecommendatio2 =
                              " You can also replace multiple useState variables with useReducer if '" +
                              (setStateRecommendation.setter +
                                "' needs the current value of '") +
                              (setStateRecommendation.missingDep + "'.");
                            break;
                          case "inlineReducer":
                            _collectRecommendatio2 =
                              " If '" +
                              setStateRecommendation.setter +
                              "' needs the current value of '" +
                              (setStateRecommendation.missingDep +
                                "', you can also switch to useReducer instead of useState and read '") +
                              (setStateRecommendation.missingDep +
                                "' in the reducer.");
                            break;
                          case "updater":
                            _collectRecommendatio2 =
                              " You can also do a functional update '" +
                              setStateRecommendation.setter +
                              "(" +
                              setStateRecommendation.missingDep.slice(0, 1) +
                              " => ...)' if you only need '" +
                              setStateRecommendation.missingDep +
                              "' in the '" +
                              (setStateRecommendation.setter + "' call.");
                            break;
                          default:
                            throw Error("Unknown case.");
                        }
                    }
                    reportProblem({
                      node: declaredDependenciesNode,
                      message:
                        "React Hook " +
                        getSource(reactiveHook) +
                        " has " +
                        (getWarningMessage(
                          missingDependencies,
                          "a",
                          "missing",
                          "include"
                        ) ||
                          getWarningMessage(
                            currentScope,
                            "an",
                            "unnecessary",
                            "exclude"
                          ) ||
                          getWarningMessage(
                            duplicateDependencies,
                            "a",
                            "duplicate",
                            "omit"
                          )) +
                        _collectRecommendatio2,
                      suggest: [
                        {
                          desc:
                            "Update the dependencies array to be: [" +
                            suggestedDeps.map(formatDependency).join(", ") +
                            "]",
                          fix: function (fixer) {
                            return fixer.replaceText(
                              declaredDependenciesNode,
                              "[" +
                                suggestedDeps.map(formatDependency).join(", ") +
                                "]"
                            );
                          }
                        }
                      ]
                    });
                  }
                } else {
                  var setStateInsideEffectWithoutDeps = null;
                  dependencies.forEach(function (_ref3, key) {
                    setStateInsideEffectWithoutDeps ||
                      _ref3.references.forEach(function (reference) {
                        if (
                          !setStateInsideEffectWithoutDeps &&
                          setStateCallSites.has(reference.identifier)
                        ) {
                          for (
                            reference = reference.from;
                            "function" !== reference.type;

                          )
                            reference = reference.upper;
                          reference.block === node &&
                            (setStateInsideEffectWithoutDeps = key);
                        }
                      });
                  });
                  if (setStateInsideEffectWithoutDeps) {
                    var _suggestedDependencies = collectRecommendations({
                      dependencies: dependencies,
                      declaredDependencies: [],
                      stableDependencies: stableDependencies,
                      externalDependencies: new Set(),
                      isEffect: !0
                    }).suggestedDependencies;
                    reportProblem({
                      node: reactiveHook,
                      message:
                        "React Hook " +
                        reactiveHookName +
                        " contains a call to '" +
                        setStateInsideEffectWithoutDeps +
                        "'. Without a list of dependencies, this can lead to an infinite chain of updates. To fix this, pass [" +
                        _suggestedDependencies.join(", ") +
                        ("] as a second argument to the " +
                          reactiveHookName +
                          " Hook."),
                      suggest: [
                        {
                          desc:
                            "Add dependencies array: [" +
                            _suggestedDependencies.join(", ") +
                            "]",
                          fix: function (fixer) {
                            return fixer.insertTextAfter(
                              node,
                              ", [" + _suggestedDependencies.join(", ") + "]"
                            );
                          }
                        }
                      ]
                    });
                  }
                }
            }
          }
          var enableDangerousAutofixThisMayCauseInfiniteLoops =
              (context.options &&
                context.options[0] &&
                context.options[0]
                  .enableDangerousAutofixThisMayCauseInfiniteLoops) ||
              !1,
            options = {
              additionalHooks:
                context.options &&
                context.options[0] &&
                context.options[0].additionalHooks
                  ? new RegExp(context.options[0].additionalHooks)
                  : void 0,
              enableDangerousAutofixThisMayCauseInfiniteLoops:
                enableDangerousAutofixThisMayCauseInfiniteLoops
            },
            getSource =
              "function" === typeof context.getSource
                ? function (node) {
                    return context.getSource(node);
                  }
                : function (node) {
                    return context.sourceCode.getText(node);
                  },
            getScope =
              "function" === typeof context.getScope
                ? function () {
                    return context.getScope();
                  }
                : function (node) {
                    return context.sourceCode.getScope(node);
                  },
            scopeManager = context.getSourceCode().scopeManager,
            setStateCallSites = new WeakMap(),
            stateVariables = new WeakSet(),
            stableKnownValueCache = new WeakMap(),
            functionWithoutCapturedValueCache = new WeakMap(),
            useEffectEventVariables = new WeakSet();
          return {
            CallExpression: function (node) {
              var callbackIndex = getReactiveHookCallbackIndex(
                node.callee,
                options
              );
              if (-1 !== callbackIndex) {
                var callback = node.arguments[callbackIndex],
                  reactiveHook = node.callee,
                  reactiveHookName =
                    getNodeWithoutReactNamespace(reactiveHook).name;
                node = node.arguments[callbackIndex + 1];
                var declaredDependenciesNode =
                  !node ||
                  ("Identifier" === node.type && "undefined" === node.name)
                    ? void 0
                    : node;
                node = /Effect($|[^a-z])/g.test(reactiveHookName);
                if (callback)
                  if (declaredDependenciesNode || node) {
                    switch (callback.type) {
                      case "FunctionExpression":
                      case "ArrowFunctionExpression":
                        visitFunctionWithDependencies(
                          callback,
                          declaredDependenciesNode,
                          reactiveHook,
                          reactiveHookName,
                          node
                        );
                        return;
                      case "TSAsExpression":
                        visitFunctionWithDependencies(
                          callback.expression,
                          declaredDependenciesNode,
                          reactiveHook,
                          reactiveHookName,
                          node
                        );
                        return;
                      case "Identifier":
                        if (
                          !declaredDependenciesNode ||
                          (declaredDependenciesNode.elements &&
                            declaredDependenciesNode.elements.some(
                              function (el) {
                                return (
                                  el &&
                                  "Identifier" === el.type &&
                                  el.name === callback.name
                                );
                              }
                            ))
                        )
                          return;
                        callbackIndex = getScope(callback).set.get(
                          callback.name
                        );
                        if (null == callbackIndex || null == callbackIndex.defs)
                          return;
                        callbackIndex = callbackIndex.defs[0];
                        if (!callbackIndex || !callbackIndex.node) break;
                        if (
                          "Variable" !== callbackIndex.type &&
                          "FunctionName" !== callbackIndex.type
                        )
                          break;
                        switch (callbackIndex.node.type) {
                          case "FunctionDeclaration":
                            visitFunctionWithDependencies(
                              callbackIndex.node,
                              declaredDependenciesNode,
                              reactiveHook,
                              reactiveHookName,
                              node
                            );
                            return;
                          case "VariableDeclarator":
                            if ((callbackIndex = callbackIndex.node.init))
                              switch (callbackIndex.type) {
                                case "ArrowFunctionExpression":
                                case "FunctionExpression":
                                  visitFunctionWithDependencies(
                                    callbackIndex,
                                    declaredDependenciesNode,
                                    reactiveHook,
                                    reactiveHookName,
                                    node
                                  );
                                  return;
                              }
                        }
                        break;
                      default:
                        reportProblem({
                          node: reactiveHook,
                          message:
                            "React Hook " +
                            reactiveHookName +
                            " received a function whose dependencies are unknown. Pass an inline function instead."
                        });
                        return;
                    }
                    reportProblem({
                      node: reactiveHook,
                      message:
                        "React Hook " +
                        reactiveHookName +
                        " has a missing dependency: '" +
                        callback.name +
                        "'. Either include it or remove the dependency array.",
                      suggest: [
                        {
                          desc:
                            "Update the dependencies array to be: [" +
                            callback.name +
                            "]",
                          fix: function (fixer) {
                            return fixer.replaceText(
                              declaredDependenciesNode,
                              "[" + callback.name + "]"
                            );
                          }
                        }
                      ]
                    });
                  } else
                    ("useMemo" !== reactiveHookName &&
                      "useCallback" !== reactiveHookName) ||
                      reportProblem({
                        node: reactiveHook,
                        message:
                          "React Hook " +
                          reactiveHookName +
                          " does nothing when called with only one argument. Did you forget to pass an array of dependencies?"
                      });
                else
                  reportProblem({
                    node: reactiveHook,
                    message:
                      "React Hook " +
                      reactiveHookName +
                      " requires an effect callback. Did you forget to pass a callback to the hook?"
                  });
              }
            }
          };
        }
      }
    };
  })();
