/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

// -1 if not a reactive Hook.
// 0 for useEffect/useMemo/useCallback.
// 1 for useImperativeHandle.
// For additionally configured Hooks, assume 0.
function getReactiveHookCallbackIndex(node, options) {
  if (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'React' &&
    node.property.type === 'Identifier' &&
    !node.computed
  ) {
    return getReactiveHookCallbackIndex(node.property);
  } else if (
    node.type === 'Identifier' &&
    (node.name === 'useEffect' ||
      node.name === 'useLayoutEffect' ||
      node.name === 'useCallback' ||
      node.name === 'useMemo')
  ) {
    return 0;
  } else if (
    node.type === 'Identifier' &&
    node.name === 'useImperativeHandle'
  ) {
    return 1;
  } else if (options && options.additionalHooks) {
    // Allow the user to provide a regular expression which enables the lint to
    // target custom reactive hooks.
    let name;
    try {
      name = getAdditionalHookName(node);
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

/**
 * Create a name we will test against our `additionalHooks` regular expression.
 */
function getAdditionalHookName(node) {
  if (node.type === 'Identifier') {
    return node.name;
  } else if (node.type === 'MemberExpression' && !node.computed) {
    const object = getAdditionalHookName(node.object);
    const property = getAdditionalHookName(node.property);
    return `${object}.${property}`;
  } else {
    throw new Error(`Unsupported node type: ${node.type}`);
  }
}

export default {
  meta: {
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          additionalHooks: {
            type: 'string',
          },
        },
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
    const options = {additionalHooks};

    return {
      FunctionExpression: visitFunctionExpression,
      ArrowFunctionExpression: visitFunctionExpression,
    };

    /**
     * Visitor for both function expressions and arrow function expressions.
     */
    function visitFunctionExpression(node) {
      // We only want to lint nodes which are reactive hook callbacks.
      if (
        (node.type !== 'FunctionExpression' &&
          node.type !== 'ArrowFunctionExpression') ||
        node.parent.type !== 'CallExpression'
      ) {
        return;
      }

      const callbackIndex = getReactiveHookCallbackIndex(
        node.parent.callee,
        options,
      );
      if (node.parent.arguments[callbackIndex] !== node) {
        return;
      }

      // Get the reactive hook node.
      const reactiveHook = node.parent.callee;

      // Get the declared dependencies for this reactive hook. If there is no
      // second argument then the reactive callback will re-run on every render.
      // So no need to check for dependency inclusion.
      const depsIndex = callbackIndex + 1;
      const declaredDependenciesNode = node.parent.arguments[depsIndex];
      if (!declaredDependenciesNode) {
        return;
      }

      // Get the current scope.
      const scope = context.getScope();

      // Find all our "pure scopes". On every re-render of a component these
      // pure scopes may have changes to the variables declared within. So all
      // variables used in our reactive hook callback but declared in a pure
      // scope need to be listed as dependencies of our reactive hook callback.
      //
      // According to the rules of React you can't read a mutable value in pure
      // scope. We can't enforce this in a lint so we trust that all variables
      // declared outside of pure scope are indeed frozen.
      const pureScopes = new Set();
      {
        let currentScope = scope.upper;
        while (currentScope) {
          pureScopes.add(currentScope);
          if (currentScope.type === 'function') {
            break;
          }
          currentScope = currentScope.upper;
        }
        // If there is no parent function scope then there are no pure scopes.
        // The ones we've collected so far are incorrect. So don't continue with
        // the lint.
        if (!currentScope) {
          return;
        }
      }

      // Get dependencies from all our resolved references in pure scopes.
      const dependencies = new Map();
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
          const dependency = normalizeDependencyNode(dependencyNode);
          // Add the dependency to a map so we can make sure it is referenced
          // again in our dependencies array.
          let info = dependencies.get(dependency);
          if (!info) {
            info = {isKnownToBeStatic: false};
            dependencies.set(dependency, info);

            if (
              reference.resolved != null &&
              Array.isArray(reference.resolved.defs)
            ) {
              const def = reference.resolved.defs[0];
              if (def != null && def.node.init != null) {
                const init = def.node.init;
                if (init.callee != null) {
                  let callee = init.callee;
                  if (
                    callee.type === 'MemberExpression' &&
                    callee.object.name === 'React' &&
                    callee.property != null
                  ) {
                    callee = callee.property;
                  }
                  if (callee.type === 'Identifier') {
                    if (
                      callee.name === 'useRef' &&
                      def.node.id.type === 'Identifier'
                    ) {
                      info.isKnownToBeStatic = true;
                    } else if (
                      callee.name === 'useState' ||
                      callee.name === 'useReducer'
                    ) {
                      if (
                        def.node.id.type === 'ArrayPattern' &&
                        def.node.id.elements.length === 2 &&
                        Array.isArray(reference.resolved.identifiers) &&
                        def.node.id.elements[1] ===
                          reference.resolved.identifiers[0]
                      ) {
                        info.isKnownToBeStatic = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        for (const childScope of currentScope.childScopes) {
          gatherDependenciesRecursively(childScope);
        }
      }

      const declaredDependencies = [];
      if (declaredDependenciesNode.type !== 'ArrayExpression') {
        // If the declared dependencies are not an array expression then we
        // can't verify that the user provided the correct dependencies. Tell
        // the user this in an error.
        context.report({
          node: declaredDependenciesNode,
          message:
            `React Hook ${context.getSource(reactiveHook)} has a second ` +
            "argument which is not an array literal. This means we can't " +
            "statically verify whether you've passed the correct dependencies.",
        });
      } else {
        declaredDependenciesNode.elements.forEach(declaredDependencyNode => {
          // Skip elided elements.
          if (declaredDependencyNode === null) {
            return;
          }
          // If we see a spread element then add a special warning.
          if (declaredDependencyNode.type === 'SpreadElement') {
            context.report({
              node: declaredDependencyNode,
              message:
                `React Hook ${context.getSource(reactiveHook)} has a spread ` +
                "element in its dependency array. This means we can't " +
                "statically verify whether you've passed the " +
                'correct dependencies.',
            });
            return;
          }
          // Try to normalize the declared dependency. If we can't then an error
          // will be thrown. We will catch that error and report an error.
          let declaredDependency;
          try {
            declaredDependency = normalizeDependencyNode(
              declaredDependencyNode,
            );
          } catch (error) {
            if (/Unexpected node type/.test(error.message)) {
              context.report({
                node: declaredDependencyNode,
                message:
                  `React Hook ${context.getSource(reactiveHook)} has a ` +
                  `complex expression in the dependency array. ` +
                  'Extract it to a separate variable so it can be statically checked.',
              });
              return;
            } else {
              throw error;
            }
          }
          // Add the dependency to our declared dependency map.
          declaredDependencies.push({
            key: declaredDependency,
            node: declaredDependencyNode,
          });
        });
      }

      let suggestedDependencies = [];

      let duplicateDependencies = new Set();
      let unnecessaryDependencies = new Set();
      let missingDependencies = new Set();

      let actualDependencies = Array.from(dependencies.keys());

      function satisfies(actualDep, dep) {
        return actualDep === dep || actualDep.startsWith(dep + '.');
      }

      // TODO: this could use some refactoring and optimizations.
      // First, ensure what user specified makes sense.
      declaredDependencies.forEach(({key}) => {
        if (actualDependencies.some(actualDep => satisfies(actualDep, key))) {
          // Legit dependency.
          if (suggestedDependencies.indexOf(key) === -1) {
            suggestedDependencies.push(key);
          } else {
            // Duplicate. Do nothing.
            duplicateDependencies.add(key);
          }
        } else {
          // Unnecessary dependency. Do nothing.
          unnecessaryDependencies.add(key);
        }
      });
      // Then fill in the missing ones.
      dependencies.forEach((info, key) => {
        if (
          !suggestedDependencies.some(suggestedDep =>
            satisfies(key, suggestedDep),
          )
        ) {
          if (!info.isKnownToBeStatic) {
            // Legit missing.
            suggestedDependencies.push(key);
            missingDependencies.add(key);
          }
        } else {
          // Already did that. Do nothing.
        }
      });

      function areDeclaredDepsAlphabetized() {
        if (declaredDependencies.length === 0) {
          return true;
        }
        const declaredDepKeys = declaredDependencies.map(dep => dep.key);
        const sortedDeclaredDepKeys = declaredDepKeys.slice().sort();
        return declaredDepKeys.join(',') === sortedDeclaredDepKeys.join(',');
      }

      if (areDeclaredDepsAlphabetized()) {
        // Alphabetize the autofix, but only if deps were already alphabetized.
        suggestedDependencies.sort();
      }

      const problemCount =
        duplicateDependencies.size +
        missingDependencies.size +
        unnecessaryDependencies.size;

      if (problemCount === 0) {
        return;
      }

      const quote = name => "'" + name + "'";
      const join = (arr, forceComma) => {
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
      };
      const list = (set, singlePrefix, label, fixVerb) => {
        if (set.size === 0) {
          return null;
        }
        return (
          (set.size > 1 ? '' : singlePrefix + ' ') +
          label +
          ' ' +
          (set.size > 1 ? 'dependencies' : 'dependency') +
          ': ' +
          join(
            Array.from(set)
              .sort()
              .map(quote),
          ) +
          `. Either ${fixVerb} ${
            set.size > 1 ? 'them' : 'it'
          } or remove the dependency array.`
        );
      };
      let extraWarning = '';
      if (unnecessaryDependencies.size > 0) {
        let badRef = null;
        Array.from(unnecessaryDependencies.keys()).forEach(key => {
          if (badRef !== null) {
            return;
          }
          if (key.endsWith('.current')) {
            badRef = key;
          }
        });
        if (badRef !== null) {
          extraWarning =
            ` Mutable values like '${badRef}' aren't valid dependencies ` +
            "because their mutation doesn't re-render the component.";
        }
      }

      context.report({
        node: declaredDependenciesNode,
        message:
          `React Hook ${context.getSource(reactiveHook)} has ` +
          // To avoid a long message, show the next actionable item.
          (list(missingDependencies, 'a', 'missing', 'include') ||
            list(unnecessaryDependencies, 'an', 'unnecessary', 'exclude') ||
            list(duplicateDependencies, 'a', 'duplicate', 'omit')) +
          extraWarning,
        fix(fixer) {
          // TODO: consider keeping the comments?
          return fixer.replaceText(
            declaredDependenciesNode,
            `[${suggestedDependencies.join(', ')}]`,
          );
        },
      });
    }
  },
};

/**
 * Gets a dependency for our reactive callback from an identifier. If the
 * identifier is the object part of a member expression then we use the entire
 * member expression as a dependency.
 *
 * For instance, if we get `props` in `props.foo` then our dependency should be
 * the full member expression.
 */
function getDependency(node) {
  if (
    node.parent.type === 'MemberExpression' &&
    node.parent.object === node &&
    node.parent.property.name !== 'current' &&
    !node.parent.computed &&
    !(
      node.parent.parent != null &&
      node.parent.parent.type === 'CallExpression' &&
      node.parent.parent.callee === node.parent
    )
  ) {
    return node.parent;
  } else {
    return node;
  }
}

/**
 * Normalizes a dependency into a standard string representation which can
 * easily be compared.
 *
 * Throws an error if the node type is not a valid dependency.
 */
function normalizeDependencyNode(node) {
  if (node.type === 'Identifier') {
    return node.name;
  } else if (node.type === 'MemberExpression' && !node.computed) {
    const object = normalizeDependencyNode(node.object);
    const property = normalizeDependencyNode(node.property);
    return `${object}.${property}`;
  } else {
    throw new Error(`Unexpected node type: ${node.type}`);
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
  let queue = [start];
  let item = null;

  while (queue.length) {
    item = queue.shift();

    if (isSameIdentifier(item, target)) {
      return item;
    }

    if (!isAncestorNodeOf(item, target)) {
      continue;
    }

    for (let [key, value] of Object.entries(item)) {
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
    a.type === 'Identifier' &&
    a.name === b.name &&
    a.range[0] === b.range[0] &&
    a.range[1] === b.range[1]
  );
}

function isAncestorNodeOf(a, b) {
  return a.range[0] <= b.range[0] && a.range[1] >= b.range[1];
}
