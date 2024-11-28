/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

'use strict';

module.exports = {
  meta: {
    docs: {
      description: 'enforce exhaustive dependencies',
      category: 'Best Practices',
      recommended: true,
      url: 'https://reactjs.org/docs/hooks-rules.html#exhaustive-deps',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          additionalHooks: {
            type: 'string',
          },
          enableDangerousAutofixThisMayCauseInfiniteLoops: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    // Parse the `additionalHooks` regex.
    const additionalHooks =
      context.options &&
      context.options[0] &&
      context.options[0].additionalHooks
        ? new RegExp(context.options[0].additionalHooks)
        : undefined;

    const enableDangerousAutofixThisMayCauseInfiniteLoops =
      (context.options &&
        context.options[0] &&
        context.options[0].enableDangerousAutofixThisMayCauseInfiniteLoops) ||
      false;

    const options = {
      additionalHooks,
      enableDangerousAutofixThisMayCauseInfiniteLoops,
    };

    function reportProblem(problem) {
      if (enableDangerousAutofixThisMayCauseInfiniteLoops) {
        // Used to enable legacy behavior. Dangerous.
        // Keep this as an option until major IDEs upgrade (including VSCode FB ESLint extension).
        if (Array.isArray(problem.suggest) && problem.suggest.length > 0) {
          problem.fix = problem.suggest[0].fix;
        }
      }
      context.report(problem);
    }

    /**
     * SourceCode#getText that also works down to ESLint 3.0.0
     */
    const getSource =
      typeof context.getSource === 'function'
        ? node => {
            return context.getSource(node);
          }
        : node => {
            return context.sourceCode.getText(node);
          };
    /**
     * SourceCode#getScope that also works down to ESLint 3.0.0
     */
    const getScope =
      typeof context.getScope === 'function'
        ? () => {
            return context.getScope();
          }
        : node => {
            return context.sourceCode.getScope(node);
          };

    const scopeManager = context.getSourceCode().scopeManager;

    // Should be shared between visitors.
    const setStateCallSites = new WeakMap();
    const stateVariables = new WeakSet();
    const stableKnownValueCache = new WeakMap();
    const functionWithoutCapturedValueCache = new WeakMap();
    const useEffectEventVariables = new WeakSet();
    function memoizeWithWeakMap(fn, map) {
      return function (arg) {
        if (map.has(arg)) {
          // to verify cache hits:
          // console.log(arg.name)
          return map.get(arg);
        }
        const result = fn(arg);
        map.set(arg, result);
        return result;
      };
    }
    /**
     * Visitor for both function expressions and arrow function expressions.
     */
    function visitFunctionWithDependencies(
      node,
      declaredDependenciesNode,
      reactiveHook,
      reactiveHookName,
      isEffect,
    ) {
      if (isEffect && node.async) {
        reportProblem({
          node: node,
          message:
            `Effect callbacks are synchronous to prevent race conditions. ` +
            `Put the async function inside:\n\n` +
            'useEffect(() => {\n' +
            '  async function fetchData() {\n' +
            '    // You can await here\n' +
            '    const response = await MyAPI.getData(someId);\n' +
            '    // ...\n' +
            '  }\n' +
            '  fetchData();\n' +
            `}, [someId]); // Or [] if effect doesn't need props or state\n\n` +
            'Learn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching',
        });
      }

      // Get the current scope.
      const scope = scopeManager.acquire(node);

      // Find all our "pure scopes"
      const pureScopes = new Set();
      let currentScope = scope;
      while (currentScope) {
        pureScopes.add(currentScope);
        currentScope = currentScope.upper;
      }

      // Get dependencies from all our resolved references in pure scopes.
      // Key is dependency string, value is whether it's stable.
      const dependencies = new Map();
      const optionalChains = new Map();
      gatherDependenciesRecursively(scope);

      function gatherDependenciesRecursively(currentScope) {
        for (const reference of currentScope.references) {
          // If this reference is not resolved or it is not declared in a pure
          // scope then we don't care about this reference.
          if (!reference.resolved) {
            continue;
          }
          if (!pureScopes.has(reference.resolved.scope)) {
            continue;
          }
          // Narrow the scope of a dependency if it is, say, a member expression.
          // Then normalize the narrowed dependency.
          const referenceNode = fastFindReferenceWithParent(
            node,
            reference.identifier,
          );
          const dependencyNode = getDependency(referenceNode);
          const dependency = analyzePropertyChain(
            dependencyNode,
            optionalChains,
          );
          // Accessing ref.current inside effect cleanup is bad.
          if (
            // We're in an effect...
            isEffect &&
            // ... and this look like accessing .current...
            dependencyNode.type === 'Identifier' &&
            (dependencyNode.parent.type === 'MemberExpression' ||
              dependencyNode.parent.type === 'OptionalMemberExpression') &&
            !dependencyNode.parent.computed &&
            dependencyNode.parent.property.type === 'Identifier' &&
            dependencyNode.parent.property.name === 'current' &&
            // ...in a cleanup function or below...
            isInsideEffectCleanup(reference)
          ) {
            currentRefsInEffectCleanup.set(dependency, {
              reference,
              dependencyNode,
            });
          }
          if (
            dependencyNode.parent.type === 'TSTypeQuery' ||
            dependencyNode.parent.type === 'TSTypeReference'
          ) {
            continue;
          }
          const def = reference.resolved.defs[0];
          if (def == null) {
            continue;
          }
          // Ignore references to the function itself as it's not defined yet.
          if (
            def.type === 'FunctionName' &&
            def.node === node &&
            def.node.id === reference.identifier
          ) {
            continue;
          }
          // Add the dependency to the map.
          dependencies.set(dependency, {
            isStable: false,
            reference,
            dependencyNode,
          });
        }
        for (const childScope of currentScope.childScopes) {
          gatherDependenciesRecursively(childScope);
        }
      }

      // Warn about accessing .current in cleanup effects.
      const currentRefsInEffectCleanup = new Map();
      for (const [dependency, {reference, dependencyNode}] of dependencies) {
        if (currentRefsInEffectCleanup.has(dependency)) {
          const {reference: currentRefReference, dependencyNode: currentRefNode} =
            currentRefsInEffectCleanup.get(dependency);
          reportProblem({
            node: currentRefNode,
            message:
              `The ref value '${dependency}' will likely have ` +
              `changed by the time this cleanup function runs. ` +
              `If this ref is managed by React, store the value in a ` +
              `state variable and refer to that state variable in the ` +
              `cleanup function.`,
            suggest: [
              {
                desc: `Store the ref value in a state variable and refer to that state variable in the cleanup function.`,
                fix(fixer) {
                  return fixer.replaceText(
                    currentRefNode,
                    `/* TODO: Store the ref value in a state variable and refer to that state variable in the cleanup function. */`,
                  );
                },
              },
            ],
          });
        }
      }
    }

    function visitCallExpression(node) {
      // Implementation here...
    }

    return {
      CallExpression: visitCallExpression,
    };
  },
};

// The meat of the logic.
function collectRecommendations({
  dependencies,
  declaredDependencies,
  stableDependencies,
  externalDependencies,
  isEffect,
}) {
  // Our primary data structure.
  // It is a logical representation of property chains:
  // `props` -> `props.foo` -> `props.foo.bar` -> `props.foo.bar.baz`
  //         -> `props.lol`
  //         -> `props.huh` -> `props.huh.okay`
  //         -> `props.wow`
  // We'll use it to mark nodes that are *used* by the programmer,
  // and the nodes that were *declared* as deps. Then we will
  // traverse it to learn which deps are missing or unnecessary.
  const depTree = createDepTree();
  function createDepTree() {
    return {
      isUsed: false, // True if used in code
      isSatisfiedRecursively: false, // True if specified in deps
      isSubtreeUsed: false, // True if something deeper is used by code
      children: new Map(), // Nodes for properties
    };
  }

  // Mark all required nodes first.
  // Imagine exclamation marks next to each used deep property.
  dependencies.forEach((_, key) => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isUsed = true;
    markAllParentsByPath(depTree, key, parent => {
      parent.isSubtreeUsed = true;
    });
  });

  // Mark all satisfied nodes.
  // Imagine checkmarks next to each declared dependency.
  declaredDependencies.forEach(({key}) => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isSatisfiedRecursively = true;
  });
  stableDependencies.forEach(key => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isSatisfiedRecursively = true;
  });

  // Tree manipulation helpers.
  function getOrCreateNodeByPath(rootNode, path) {
    const keys = path.split('.');
    let node = rootNode;
    for (const key of keys) {
      let child = node.children.get(key);
      if (!child) {
        child = createDepTree();
        node.children.set(key, child);
      }
      node = child;
    }
    return node;
  }
  function markAllParentsByPath(rootNode, path, fn) {
    const keys = path.split('.');
    let node = rootNode;
    for (const key of keys) {
      const child = node.children.get(key);
      if (!child) {
        return;
      }
      fn(child);
      node = child;
    }
  }

  // Now we can learn which dependencies are missing or necessary.
  const missingDependencies = new Set();
  const satisfyingDependencies = new Set();
  scanTreeRecursively(
    depTree,
    missingDependencies,
    satisfyingDependencies,
    key => key,
  );
  function scanTreeRecursively(node, missingPaths, satisfyingPaths, keyToPath) {
    node.children.forEach((child, key) => {
      const path = keyToPath(key);
      if (child.isSatisfiedRecursively) {
        if (child.isSubtreeUsed) {
          // Remember this dep actually satisfied something.
          satisfyingPaths.add(path);
        }
        // It doesn't matter if there's something deeper.
        // It would be transitively satisfied since we assume immutability.
        // `props.foo` is enough if you read `props.foo.id`.
        return;
      }
      if (child.isUsed) {
        // Remember that no declared deps satisfied this node.
        missingPaths.add(path);
        // If we got here, nothing in its subtree was satisfied.
        // No need to search further.
        return;
      }
      scanTreeRecursively(
        child,
        missingPaths,
        satisfyingPaths,
        childKey => path + '.' + childKey,
      );
    });
  }

  // Collect suggestions in the order they were originally specified.
  const suggestedDependencies = [];
  const unnecessaryDependencies = new Set();
  const duplicateDependencies = new Set();
  declaredDependencies.forEach(({key}) => {
    // Does this declared dep satisfy a real need?
    if (satisfyingDependencies.has(key)) {
      if (suggestedDependencies.indexOf(key) === -1) {
        // Good one.
        suggestedDependencies.push(key);
      } else {
        // Duplicate.
        duplicateDependencies.add(key);
      }
    } else {
      if (
        isEffect &&
        !key.endsWith('.current') &&
        !externalDependencies.has(key)
      ) {
        // Effects are allowed extra "unnecessary" deps.
        // Such as resetting scroll when ID changes.
        // Consider them legit.
        // The exception is ref.current which is always wrong.
        if (suggestedDependencies.indexOf(key) === -1) {
          suggestedDependencies.push(key);
        }
      } else {
        // It's definitely not needed.
        unnecessaryDependencies.add(key);
      }
    }
  });

  // Then add the missing ones at the end.
  missingDependencies.forEach(key => {
    suggestedDependencies.push(key);
  });

  return {
    suggestedDependencies,
    unnecessaryDependencies,
    duplicateDependencies,
    missingDependencies,
  };
}

// If the node will result in constructing a referentially unique value, return
// its human readable type name, else return null.
function getConstructionExpressionType(node) {
  switch (node.type) {
    case 'ObjectExpression':
      return 'object';
    case 'ArrayExpression':
      return 'array';
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'function';
    case 'ClassExpression':
      return 'class';
    case 'ConditionalExpression':
      if (
        getConstructionExpressionType(node.consequent) != null ||
        getConstructionExpressionType(node.alternate) != null
      ) {
        return 'conditional';
      }
      return null;
    case 'LogicalExpression':
      if (
        getConstructionExpressionType(node.left) != null ||
        getConstructionExpressionType(node.right) != null
      ) {
        return 'logical expression';
      }
      return null;
    case 'JSXFragment':
      return 'JSX fragment';
    case 'JSXElement':
      return 'JSX element';
    case 'AssignmentExpression':
      if (getConstructionExpressionType(node.right) != null) {
        return 'assignment expression';
      }
      return null;
    case 'NewExpression':
      return 'object construction';
    case 'Literal':
      if (node.value instanceof RegExp) {
        return 'regular expression';
      }
      return null;
    case 'TypeCastExpression':
    case 'AsExpression':
    case 'TSAsExpression':
      return getConstructionExpressionType(node.expression);
  }
  return null;
}

// Finds variables declared as dependencies
// that would invalidate on every render.
function scanForConstructions({
  declaredDependencies,
  declaredDependenciesNode,
  componentScope,
  scope,
}) {
  const constructions = declaredDependencies
    .map(({key}) => {
      const ref = componentScope.variables.find(v => v.name === key);
      if (ref == null) {
        return null;
      }

      const node = ref.defs[0];
      if (node == null) {
        return null;
      }
      // const handleChange = function () {}
      // const handleChange = () => {}
      // const foo = {}
      // const foo = []
      // etc.
      if (
        node.type === 'Variable' &&
        node.node.type === 'VariableDeclarator' &&
        node.node.id.type === 'Identifier' && // Ensure this is not destructed assignment
        node.node.init != null
      ) {
        const constantExpressionType = getConstructionExpressionType(
          node.node.init,
        );
        if (constantExpressionType != null) {
          return [ref, constantExpressionType];
        }
      }
      // function handleChange() {}
      if (
        node.type === 'FunctionName' &&
        node.node.type === 'FunctionDeclaration'
      ) {
        return [ref, 'function'];
      }

      // class Foo {}
      if (node.type === 'ClassName' && node.node.type === 'ClassDeclaration') {
        return [ref, 'class'];
      }
      return null;
    })
    .filter(Boolean);

  function isUsedOutsideOfHook(ref) {
    let foundWriteExpr = false;
    for (let i = 0; i < ref.references.length; i++) {
      const reference = ref.references[i];
      if (reference.writeExpr) {
        if (foundWriteExpr) {
          // Two writes to the same function.
          return true;
        } else {
          // Ignore first write as it's not usage.
          foundWriteExpr = true;
          continue;
        }
      }
      let currentScope = reference.from;
      while (currentScope !== scope && currentScope != null) {
        currentScope = currentScope.upper;
      }
      if (currentScope !== scope) {
        // This reference is outside the Hook callback.
        // It can only be legit if it's the deps array.
        if (!isAncestorNodeOf(declaredDependenciesNode, reference.identifier)) {
          return true;
        }
      }
    }
    return false;
  }

  return constructions.map(([ref, depType]) => ({
    construction: ref.defs[0],
    depType,
    isUsedOutsideOfHook: isUsedOutsideOfHook(ref),
  }));
}

/**
 * Assuming () means the passed/returned node:
 * (props) => (props)
 * props.(foo) => (props.foo)
 * props.foo.(bar) => (props).foo.bar
 * props.foo.bar.(baz) => (props).foo.bar.baz
 */
function getDependency(node) {
  if (
    (node.parent.type === 'MemberExpression' ||
      node.parent.type === 'OptionalMemberExpression') &&
    node.parent.object === node &&
    node.parent.property.name !== 'current' &&
    !node.parent.computed &&
    !(
      node.parent.parent != null &&
      (node.parent.parent.type === 'CallExpression' ||
        node.parent.parent.type === 'OptionalCallExpression') &&
      node.parent.parent.callee === node.parent
    )
  ) {
    return getDependency(node.parent);
  } else if (
    // Note: we don't check OptionalMemberExpression because it can't be LHS.
    node.type === 'MemberExpression' &&
    node.parent &&
    node.parent.type === 'AssignmentExpression' &&
    node.parent.left === node
  ) {
    return node.object;
  } else {
    return node;
  }
}

/**
 * Mark a node as either optional or required.
 * Note: If the node argument is an OptionalMemberExpression, it doesn't necessarily mean it is optional.
 * It just means there is an optional member somewhere inside.
 * This particular node might still represent a required member, so check .optional field.
 */
function markNode(node, optionalChains, result) {
  if (optionalChains) {
    if (node.optional) {
      // We only want to consider it optional if *all* usages were optional.
      if (!optionalChains.has(result)) {
        // Mark as (maybe) optional. If there's a required usage, this will be overridden.
        optionalChains.set(result, true);
      }
    } else {
      // Mark as required.
      optionalChains.set(result, false);
    }
  }
}

/**
 * Assuming () means the passed node.
 * (foo) -> 'foo'
 * foo(.)bar -> 'foo.bar'
 * foo.bar(.)baz -> 'foo.bar.baz'
 * Otherwise throw.
 */
function analyzePropertyChain(node, optionalChains) {
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    const result = node.name;
    if (optionalChains) {
      // Mark as required.
      optionalChains.set(result, false);
    }
    return result;
  } else if (node.type === 'MemberExpression' && !node.computed) {
    const object = analyzePropertyChain(node.object, optionalChains);
    const property = analyzePropertyChain(node.property, null);
    const result = `${object}.${property}`;
    markNode(node, optionalChains, result);
    return result;
  } else if (node.type === 'OptionalMemberExpression' && !node.computed) {
    const object = analyzePropertyChain(node.object, optionalChains);
    const property = analyzePropertyChain(node.property, null);
    const result = `${object}.${property}`;
    markNode(node, optionalChains, result);
    return result;
  } else if (node.type === 'ChainExpression' && !node.computed) {
    const expression = node.expression;

    if (expression.type === 'CallExpression') {
      throw new Error(`Unsupported node type: ${expression.type}`);
    }

    const object = analyzePropertyChain(expression.object, optionalChains);
    const property = analyzePropertyChain(expression.property, null);
    const result = `${object}.${property}`;
    markNode(expression, optionalChains, result);
    return result;
  } else {
    throw new Error(`Unsupported node type: ${node.type}`);
  }
}

function getNodeWithoutReactNamespace(node, options) {
  if (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'React' &&
    node.property.type === 'Identifier' &&
    !node.computed
  ) {
    return node.property;
  }
  return node;
}

// What's the index of callback that needs to be analyzed for a given Hook?
// -1 if it's not a Hook we care about (e.g. useState).
// 0 for useEffect/useMemo/useCallback(fn).
// 1 for useImperativeHandle(ref, fn).
// For additionally configured Hooks, assume that they're like useEffect (0).
function getReactiveHookCallbackIndex(calleeNode, options) {
  const node = getNodeWithoutReactNamespace(calleeNode);
  if (node.type !== 'Identifier') {
    return -1;
  }
  switch (node.name) {
    case 'useEffect':
    case 'useLayoutEffect':
    case 'useCallback':
    case 'useMemo':
      // useEffect(fn)
      return 0;
    case 'useImperativeHandle':
      // useImperativeHandle(ref, fn)
      return 1;
    default:
      if (node === calleeNode && options && options.additionalHooks) {
        // Allow the user to provide a regular expression which enables the lint to
        // target custom reactive hooks.
        let name;
        try {
          name = analyzePropertyChain(node, null);
        } catch (error) {
          if (/Unsupported node type/.test(error.message)) {
            return 0;
          } else {
            throw error;
          }
        }
        return options.additionalHooks.test(name) ? 0 : -1;
      } else {
        return -1;
      }
  }
}

/**
 * ESLint won't assign node.parent to references from context.getScope()
 *
 * So instead we search for the node from an ancestor assigning node.parent
 * as we go. This mutates the AST.
 *
 * This traversal is:
 * - optimized by only searching nodes with a range surrounding our target node
 * - agnostic to AST node types, it looks for `{ type: string, ... }`
 */
function fastFindReferenceWithParent(start, target) {
  const queue = [start];
  let item = null;

  while (queue.length) {
    item = queue.shift();

    if (isSameIdentifier(item, target)) {
      return item;
    }

    if (!isAncestorNodeOf(item, target)) {
      continue;
    }

    for (const [key, value] of Object.entries(item)) {
      if (key === 'parent') {
        continue;
      }
      if (isNodeLike(value)) {
        value.parent = item;
        queue.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(val => {
          if (isNodeLike(val)) {
            val.parent = item;
            queue.push(val);
          }
        });
      }
    }
  }

  return null;
}

function joinEnglish(arr) {
  let s = '';
  for (let i = 0; i < arr.length; i++) {
    s += arr[i];
    if (i === 0 && arr.length === 2) {
      s += ' and ';
    } else if (i === arr.length - 2 && arr.length > 2) {
      s += ', and ';
    } else if (i < arr.length - 1) {
      s += ', ';
    }
  }
  return s;
}

function isNodeLike(val) {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    typeof val.type === 'string'
  );
}

function isSameIdentifier(a, b) {
  return (
    (a.type === 'Identifier' || a.type === 'JSXIdentifier') &&
    a.type === b.type &&
    a.name === b.name &&
    a.range[0] === b.range[0] &&
    a.range[1] === b.range[1]
  );
}

function isAncestorNodeOf(a, b) {
  return a.range[0] <= b.range[0] && a.range[1] >= b.range[1];
}

function isUseEffectEventIdentifier(node) {
  if (__EXPERIMENTAL__) {
    return node.type === 'Identifier' && node.name === 'useEffectEvent';
  }
  return false;
}

function getUnknownDependenciesMessage(reactiveHookName) {
  return (
    `React Hook ${reactiveHookName} received a function whose dependencies ` +
    `are unknown. Pass an inline function instead.`
  );
}
