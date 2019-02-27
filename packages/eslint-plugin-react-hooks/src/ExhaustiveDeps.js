/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

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
      const reactiveHookName = getNodeWithoutReactNamespace(reactiveHook).name;
      const isEffect = reactiveHookName.endsWith('Effect');

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

      // These are usually mistaken. Collect them.
      const currentRefsInEffectCleanup = new Map();

      // Is this reference inside a cleanup function for this effect node?
      // We can check by traversing scopes upwards  from the reference, and checking
      // if the last "return () => " we encounter is located directly inside the effect.
      function isInsideEffectCleanup(reference) {
        let curScope = reference.from;
        let isInReturnedFunction = false;
        while (curScope.block !== node) {
          if (curScope.type === 'function') {
            isInReturnedFunction =
              curScope.block.parent != null &&
              curScope.block.parent.type === 'ReturnStatement';
          }
          curScope = curScope.upper;
        }
        return isInReturnedFunction;
      }

      // Get dependencies from all our resolved references in pure scopes.
      // Key is dependency string, value is whether it's static.
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
          const dependency = toPropertyAccessString(dependencyNode);

          // Accessing ref.current inside effect cleanup is bad.
          if (
            // We're in an effect...
            isEffect &&
            // ... and this look like accessing .current...
            dependencyNode.type === 'Identifier' &&
            dependencyNode.parent.type === 'MemberExpression' &&
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

          // Add the dependency to a map so we can make sure it is referenced
          // again in our dependencies array. Remember whether it's static.
          if (!dependencies.has(dependency)) {
            const isStatic = isDefinitelyStaticDependency(reference);
            dependencies.set(dependency, {
              isStatic,
              reference,
            });
          }
        }
        for (const childScope of currentScope.childScopes) {
          gatherDependenciesRecursively(childScope);
        }
      }

      // Warn about accessing .current in cleanup effects.
      currentRefsInEffectCleanup.forEach(
        ({reference, dependencyNode}, dependency) => {
          const references = reference.resolved.references;
          // Is React managing this ref or us?
          // Let's see if we can find a .current assignment.
          let foundCurrentAssignment = false;
          for (let i = 0; i < references.length; i++) {
            const {identifier} = references[i];
            const {parent} = identifier;
            if (
              parent != null &&
              // ref.current
              parent.type === 'MemberExpression' &&
              !parent.computed &&
              parent.property.type === 'Identifier' &&
              parent.property.name === 'current' &&
              // ref.current = <something>
              parent.parent.type === 'AssignmentExpression' &&
              parent.parent.left === parent
            ) {
              foundCurrentAssignment = true;
              break;
            }
          }
          // We only want to warn about React-managed refs.
          if (foundCurrentAssignment) {
            return;
          }
          context.report({
            node: dependencyNode.parent.property,
            message:
              `Accessing '${dependency}.current' during the effect cleanup ` +
              `will likely read a different ref value because by this time React ` +
              `has already updated the ref. If this ref is managed by React, store ` +
              `'${dependency}.current' in a variable inside ` +
              `the effect itself and refer to that variable from the cleanup function.`,
          });
        },
      );

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
            declaredDependency = toPropertyAccessString(declaredDependencyNode);
          } catch (error) {
            if (/Unsupported node type/.test(error.message)) {
              if (declaredDependencyNode.type === 'Literal') {
                if (typeof declaredDependencyNode.value === 'string') {
                  context.report({
                    node: declaredDependencyNode,
                    message:
                      `The ${
                        declaredDependencyNode.raw
                      } string literal is not a valid dependency ` +
                      `because it never changes. Did you mean to ` +
                      `include ${
                        declaredDependencyNode.value
                      } in the array instead?`,
                  });
                } else {
                  context.report({
                    node: declaredDependencyNode,
                    message:
                      `The '${
                        declaredDependencyNode.raw
                      }' literal is not a valid dependency ` +
                      'because it never changes. You can safely remove it.',
                  });
                }
              } else {
                context.report({
                  node: declaredDependencyNode,
                  message:
                    `React Hook ${context.getSource(reactiveHook)} has a ` +
                    `complex expression in the dependency array. ` +
                    'Extract it to a separate variable so it can be statically checked.',
                });
              }

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

      // TODO: we can do a pass at this code and pick more appropriate
      // data structures to avoid nested loops if we can.
      let suggestedDependencies = [];
      let duplicateDependencies = new Set();
      let unnecessaryDependencies = new Set();
      let missingDependencies = new Set();
      let actualDependencies = Array.from(dependencies.keys());
      let foundStaleAssignments = false;

      function satisfies(actualDep, dep) {
        return actualDep === dep || actualDep.startsWith(dep + '.');
      }

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
          if (isEffect && !key.endsWith('.current')) {
            // Effects may have extra "unnecessary" deps.
            // Such as resetting scroll when ID changes.
            // The exception is ref.current which is always wrong.
            // Consider them legit.
            if (suggestedDependencies.indexOf(key) === -1) {
              suggestedDependencies.push(key);
            }
          } else {
            // Unnecessary dependency. Remember to report it.
            unnecessaryDependencies.add(key);
          }
        }
      });

      // Then fill in the missing ones.
      dependencies.forEach(({isStatic, reference}, key) => {
        if (reference.writeExpr) {
          foundStaleAssignments = true;
          context.report({
            node: reference.writeExpr,
            message:
              `Assignments to the '${key}' variable from inside a React ${context.getSource(
                reactiveHook,
              )} Hook ` +
              `will not persist between re-renders. ` +
              `If it's only needed by this Hook, move the variable inside it. ` +
              `Alternatively, declare a ref with the useRef Hook, ` +
              `and keep the mutable value in its 'current' property.`,
          });
        }

        if (
          !suggestedDependencies.some(suggestedDep =>
            satisfies(key, suggestedDep),
          )
        ) {
          if (!isStatic) {
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

      if (foundStaleAssignments) {
        // The intent isn't clear so we'll wait until you fix those first.
        return;
      }

      function getWarningMessage(deps, singlePrefix, label, fixVerb) {
        if (deps.size === 0) {
          return null;
        }
        return (
          (deps.size > 1 ? '' : singlePrefix + ' ') +
          label +
          ' ' +
          (deps.size > 1 ? 'dependencies' : 'dependency') +
          ': ' +
          joinEnglish(
            Array.from(deps)
              .sort()
              .map(name => "'" + name + "'"),
          ) +
          `. Either ${fixVerb} ${
            deps.size > 1 ? 'them' : 'it'
          } or remove the dependency array.`
        );
      }

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
          (getWarningMessage(missingDependencies, 'a', 'missing', 'include') ||
            getWarningMessage(
              unnecessaryDependencies,
              'an',
              'unnecessary',
              'exclude',
            ) ||
            getWarningMessage(
              duplicateDependencies,
              'a',
              'duplicate',
              'omit',
            )) +
          extraWarning,
        fix(fixer) {
          // TODO: consider preserving the comments or formatting?
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
 * Assuming () means the passed/returned node:
 * (props) => (props)
 * props.(foo) => (props.foo)
 * props.foo.(bar) => (props.foo).bar
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
 * Assuming () means the passed node.
 * (foo) -> 'foo'
 * foo.(bar) -> 'foo.bar'
 * foo.bar.(baz) -> 'foo.bar.baz'
 * Otherwise throw.
 */
function toPropertyAccessString(node) {
  if (node.type === 'Identifier') {
    return node.name;
  } else if (node.type === 'MemberExpression' && !node.computed) {
    const object = toPropertyAccessString(node.object);
    const property = toPropertyAccessString(node.property);
    return `${object}.${property}`;
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
  let node = getNodeWithoutReactNamespace(calleeNode);
  if (node.type !== 'Identifier') {
    return null;
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
          name = toPropertyAccessString(node);
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

// const [state, setState] = useState() / React.useState()
//               ^^^ true for this reference
// const [state, dispatch] = useReducer() / React.useReducer()
//               ^^^ true for this reference
// const ref = useRef()
//       ^^^ true for this reference
// False for everything else.
function isDefinitelyStaticDependency(reference) {
  // This function is written defensively because I'm not sure about corner cases.
  // TODO: we can strengthen this if we're sure about the types.
  const resolved = reference.resolved;
  if (resolved == null || !Array.isArray(resolved.defs)) {
    return false;
  }
  const def = resolved.defs[0];
  if (def == null) {
    return false;
  }
  // Look for `let stuff = ...`
  if (def.node.type !== 'VariableDeclarator') {
    return false;
  }
  const init = def.node.init;
  if (init == null) {
    return false;
  }
  // Detect primitive constants
  // const foo = 42
  const declaration = def.node.parent;
  if (
    declaration.kind === 'const' &&
    init.type === 'Literal' &&
    (typeof init.value === 'string' ||
      typeof init.value === 'number' ||
      init.value === null)
  ) {
    // Definitely static
    return true;
  }
  // Detect known Hook calls
  // const [_, setState] = useState()
  if (init.type !== 'CallExpression') {
    return false;
  }
  let callee = init.callee;
  // Step into `= React.something` initializer.
  if (
    callee.type === 'MemberExpression' &&
    callee.object.name === 'React' &&
    callee.property != null &&
    !callee.computed
  ) {
    callee = callee.property;
  }
  if (callee.type !== 'Identifier') {
    return false;
  }
  const id = def.node.id;
  if (callee.name === 'useRef' && id.type === 'Identifier') {
    // useRef() return value is static.
    return true;
  } else if (callee.name === 'useState' || callee.name === 'useReducer') {
    // Only consider second value in initializing tuple static.
    if (
      id.type === 'ArrayPattern' &&
      id.elements.length === 2 &&
      Array.isArray(reference.resolved.identifiers) &&
      // Is second tuple value the same reference we're checking?
      id.elements[1] === reference.resolved.identifiers[0]
    ) {
      return true;
    }
  }
  // By default assume it's dynamic.
  return false;
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
    a.type === 'Identifier' &&
    a.name === b.name &&
    a.range[0] === b.range[0] &&
    a.range[1] === b.range[1]
  );
}

function isAncestorNodeOf(a, b) {
  return a.range[0] <= b.range[0] && a.range[1] >= b.range[1];
}
