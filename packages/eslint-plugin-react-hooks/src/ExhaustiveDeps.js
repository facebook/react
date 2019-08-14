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

    // Should be shared between visitors.
    let setStateCallSites = new WeakMap();
    let stateVariables = new WeakSet();
    let staticKnownValueCache = new WeakMap();
    let functionWithoutCapturedValueCache = new WeakMap();
    function memoizeWithWeakMap(fn, map) {
      return function(arg) {
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
      if (!declaredDependenciesNode && !isEffect) {
        // These are only used for optimization.
        if (
          reactiveHookName === 'useMemo' ||
          reactiveHookName === 'useCallback'
        ) {
          // TODO: Can this have an autofix?
          context.report({
            node: node.parent.callee,
            message:
              `React Hook ${reactiveHookName} does nothing when called with ` +
              `only one argument. Did you forget to pass an array of ` +
              `dependencies?`,
          });
        }
        return;
      }

      if (isEffect && node.async) {
        context.report({
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
            'Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching',
        });
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
      let componentScope = null;
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
        componentScope = currentScope;
      }

      // Next we'll define a few helpers that helps us
      // tell if some values don't have to be declared as deps.

      // Some are known to be static based on Hook calls.
      // const [state, setState] = useState() / React.useState()
      //               ^^^ true for this reference
      // const [state, dispatch] = useReducer() / React.useReducer()
      //               ^^^ true for this reference
      // const ref = useRef()
      //       ^^^ true for this reference
      // False for everything else.
      function isStaticKnownHookValue(resolved) {
        if (!Array.isArray(resolved.defs)) {
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
        let declaration = def.node.parent;
        if (declaration == null) {
          // This might happen if variable is declared after the callback.
          // In that case ESLint won't set up .parent refs.
          // So we'll set them up manually.
          fastFindReferenceWithParent(componentScope.block, def.node.id);
          declaration = def.node.parent;
          if (declaration == null) {
            return false;
          }
        }
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
        const {name} = callee;
        if (name === 'useRef' && id.type === 'Identifier') {
          // useRef() return value is static.
          return true;
        } else if (name === 'useState' || name === 'useReducer') {
          // Only consider second value in initializing tuple static.
          if (
            id.type === 'ArrayPattern' &&
            id.elements.length === 2 &&
            Array.isArray(resolved.identifiers)
          ) {
            // Is second tuple value the same reference we're checking?
            if (id.elements[1] === resolved.identifiers[0]) {
              if (name === 'useState') {
                const references = resolved.references;
                for (let i = 0; i < references.length; i++) {
                  setStateCallSites.set(
                    references[i].identifier,
                    id.elements[0],
                  );
                }
              }
              // Setter is static.
              return true;
            } else if (id.elements[0] === resolved.identifiers[0]) {
              if (name === 'useState') {
                const references = resolved.references;
                for (let i = 0; i < references.length; i++) {
                  stateVariables.add(references[i].identifier);
                }
              }
              // State variable itself is dynamic.
              return false;
            }
          }
        }
        // By default assume it's dynamic.
        return false;
      }

      // Some are just functions that don't reference anything dynamic.
      function isFunctionWithoutCapturedValues(resolved) {
        if (!Array.isArray(resolved.defs)) {
          return false;
        }
        const def = resolved.defs[0];
        if (def == null) {
          return false;
        }
        if (def.node == null || def.node.id == null) {
          return false;
        }
        // Search the direct component subscopes for
        // top-level function definitions matching this reference.
        const fnNode = def.node;
        let childScopes = componentScope.childScopes;
        let fnScope = null;
        let i;
        for (i = 0; i < childScopes.length; i++) {
          let childScope = childScopes[i];
          let childScopeBlock = childScope.block;
          if (
            // function handleChange() {}
            (fnNode.type === 'FunctionDeclaration' &&
              childScopeBlock === fnNode) ||
            // const handleChange = () => {}
            // const handleChange = function() {}
            (fnNode.type === 'VariableDeclarator' &&
              childScopeBlock.parent === fnNode)
          ) {
            // Found it!
            fnScope = childScope;
            break;
          }
        }
        if (fnScope == null) {
          return false;
        }
        // Does this function capture any values
        // that are in pure scopes (aka render)?
        for (i = 0; i < fnScope.through.length; i++) {
          const ref = fnScope.through[i];
          if (ref.resolved == null) {
            continue;
          }
          if (
            pureScopes.has(ref.resolved.scope) &&
            // Static values are fine though,
            // although we won't check functions deeper.
            !memoizedIsStaticKnownHookValue(ref.resolved)
          ) {
            return false;
          }
        }
        // If we got here, this function doesn't capture anything
        // from render--or everything it captures is known static.
        return true;
      }

      // Remember such values. Avoid re-running extra checks on them.
      const memoizedIsStaticKnownHookValue = memoizeWithWeakMap(
        isStaticKnownHookValue,
        staticKnownValueCache,
      );
      const memoizedIsFunctionWithoutCapturedValues = memoizeWithWeakMap(
        isFunctionWithoutCapturedValues,
        functionWithoutCapturedValueCache,
      );

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

          const def = reference.resolved.defs[0];

          if (def == null) {
            continue;
          }

          // Ignore references to the function itself as it's not defined yet.
          if (def.node != null && def.node.init === node.parent) {
            continue;
          }

          // Ignore Flow type parameters
          if (def.type === 'TypeParameter') {
            continue;
          }

          // Add the dependency to a map so we can make sure it is referenced
          // again in our dependencies array. Remember whether it's static.
          if (!dependencies.has(dependency)) {
            const resolved = reference.resolved;
            const isStatic =
              memoizedIsStaticKnownHookValue(resolved) ||
              memoizedIsFunctionWithoutCapturedValues(resolved);
            dependencies.set(dependency, {
              isStatic,
              references: [reference],
            });
          } else {
            dependencies.get(dependency).references.push(reference);
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
              `The ref value '${dependency}.current' will likely have ` +
              `changed by the time this effect cleanup function runs. If ` +
              `this ref points to a node rendered by React, copy ` +
              `'${dependency}.current' to a variable inside the effect, and ` +
              `use that variable in the cleanup function.`,
          });
        },
      );

      // Warn about assigning to variables in the outer scope.
      // Those are usually bugs.
      let staleAssignments = new Set();
      function reportStaleAssignment(writeExpr, key) {
        if (staleAssignments.has(key)) {
          return;
        }
        staleAssignments.add(key);
        context.report({
          node: writeExpr,
          message:
            `Assignments to the '${key}' variable from inside React Hook ` +
            `${context.getSource(reactiveHook)} will be lost after each ` +
            `render. To preserve the value over time, store it in a useRef ` +
            `Hook and keep the mutable value in the '.current' property. ` +
            `Otherwise, you can move this variable directly inside ` +
            `${context.getSource(reactiveHook)}.`,
        });
      }

      // Remember which deps are optional and report bad usage first.
      const optionalDependencies = new Set();
      dependencies.forEach(({isStatic, references}, key) => {
        if (isStatic) {
          optionalDependencies.add(key);
        }
        references.forEach(reference => {
          if (reference.writeExpr) {
            reportStaleAssignment(reference.writeExpr, key);
          }
        });
      });

      if (staleAssignments.size > 0) {
        // The intent isn't clear so we'll wait until you fix those first.
        return;
      }

      if (!declaredDependenciesNode) {
        // Check if there are any top-level setState() calls.
        // Those tend to lead to infinite loops.
        let setStateInsideEffectWithoutDeps = null;
        dependencies.forEach(({isStatic, references}, key) => {
          if (setStateInsideEffectWithoutDeps) {
            return;
          }
          references.forEach(reference => {
            if (setStateInsideEffectWithoutDeps) {
              return;
            }

            const id = reference.identifier;
            const isSetState = setStateCallSites.has(id);
            if (!isSetState) {
              return;
            }

            let fnScope = reference.from;
            while (fnScope.type !== 'function') {
              fnScope = fnScope.upper;
            }
            const isDirectlyInsideEffect = fnScope.block === node;
            if (isDirectlyInsideEffect) {
              // TODO: we could potentially ignore early returns.
              setStateInsideEffectWithoutDeps = key;
            }
          });
        });
        if (setStateInsideEffectWithoutDeps) {
          let {suggestedDependencies} = collectRecommendations({
            dependencies,
            declaredDependencies: [],
            optionalDependencies,
            externalDependencies: new Set(),
            isEffect: true,
          });
          context.report({
            node: node.parent.callee,
            message:
              `React Hook ${reactiveHookName} contains a call to '${setStateInsideEffectWithoutDeps}'. ` +
              `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
              `To fix this, pass [` +
              suggestedDependencies.join(', ') +
              `] as a second argument to the ${reactiveHookName} Hook.`,
            fix(fixer) {
              return fixer.insertTextAfter(
                node,
                `, [${suggestedDependencies.join(', ')}]`,
              );
            },
          });
        }
        return;
      }

      const declaredDependencies = [];
      const externalDependencies = new Set();
      if (declaredDependenciesNode.type !== 'ArrayExpression') {
        // If the declared dependencies are not an array expression then we
        // can't verify that the user provided the correct dependencies. Tell
        // the user this in an error.
        context.report({
          node: declaredDependenciesNode,
          message:
            `React Hook ${context.getSource(reactiveHook)} was passed a ` +
            'dependency list that is not an array literal. This means we ' +
            "can't statically verify whether you've passed the correct " +
            'dependencies.',
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
                if (dependencies.has(declaredDependencyNode.value)) {
                  context.report({
                    node: declaredDependencyNode,
                    message:
                      `The ${
                        declaredDependencyNode.raw
                      } literal is not a valid dependency ` +
                      `because it never changes. ` +
                      `Did you mean to include ${
                        declaredDependencyNode.value
                      } in the array instead?`,
                  });
                } else {
                  context.report({
                    node: declaredDependencyNode,
                    message:
                      `The ${
                        declaredDependencyNode.raw
                      } literal is not a valid dependency ` +
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

          let maybeID = declaredDependencyNode;
          while (maybeID.type === 'MemberExpression') {
            maybeID = maybeID.object;
          }
          const isDeclaredInComponent = !componentScope.through.some(
            ref => ref.identifier === maybeID,
          );

          // Add the dependency to our declared dependency map.
          declaredDependencies.push({
            key: declaredDependency,
            node: declaredDependencyNode,
          });

          if (!isDeclaredInComponent) {
            externalDependencies.add(declaredDependency);
          }
        });
      }

      let {
        suggestedDependencies,
        unnecessaryDependencies,
        missingDependencies,
        duplicateDependencies,
      } = collectRecommendations({
        dependencies,
        declaredDependencies,
        optionalDependencies,
        externalDependencies,
        isEffect,
      });

      const problemCount =
        duplicateDependencies.size +
        missingDependencies.size +
        unnecessaryDependencies.size;

      if (problemCount === 0) {
        // If nothing else to report, check if some callbacks
        // are bare and would invalidate on every render.
        const bareFunctions = scanForDeclaredBareFunctions({
          declaredDependencies,
          declaredDependenciesNode,
          componentScope,
          scope,
        });
        bareFunctions.forEach(({fn, suggestUseCallback}) => {
          let message =
            `The '${fn.name.name}' function makes the dependencies of ` +
            `${reactiveHookName} Hook (at line ${
              declaredDependenciesNode.loc.start.line
            }) ` +
            `change on every render.`;
          if (suggestUseCallback) {
            message +=
              ` To fix this, ` +
              `wrap the '${
                fn.name.name
              }' definition into its own useCallback() Hook.`;
          } else {
            message +=
              ` Move it inside the ${reactiveHookName} callback. ` +
              `Alternatively, wrap the '${
                fn.name.name
              }' definition into its own useCallback() Hook.`;
          }
          // TODO: What if the function needs to change on every render anyway?
          // Should we suggest removing effect deps as an appropriate fix too?
          context.report({
            // TODO: Why not report this at the dependency site?
            node: fn.node,
            message,
            fix(fixer) {
              // Only handle the simple case: arrow functions.
              // Wrapping function declarations can mess up hoisting.
              if (suggestUseCallback && fn.type === 'Variable') {
                return [
                  // TODO: also add an import?
                  fixer.insertTextBefore(fn.node.init, 'useCallback('),
                  // TODO: ideally we'd gather deps here but it would require
                  // restructuring the rule code. This will cause a new lint
                  // error to appear immediately for useCallback. Note we're
                  // not adding [] because would that changes semantics.
                  fixer.insertTextAfter(fn.node.init, ')'),
                ];
              }
            },
          });
        });
        return;
      }

      // If we're going to report a missing dependency,
      // we might as well recalculate the list ignoring
      // the currently specified deps. This can result
      // in some extra deduplication. We can't do this
      // for effects though because those have legit
      // use cases for over-specifying deps.
      if (!isEffect && missingDependencies.size > 0) {
        suggestedDependencies = collectRecommendations({
          dependencies,
          declaredDependencies: [], // Pretend we don't know
          optionalDependencies,
          externalDependencies,
          isEffect,
        }).suggestedDependencies;
      }

      // Alphabetize the suggestions, but only if deps were already alphabetized.
      function areDeclaredDepsAlphabetized() {
        if (declaredDependencies.length === 0) {
          return true;
        }
        const declaredDepKeys = declaredDependencies.map(dep => dep.key);
        const sortedDeclaredDepKeys = declaredDepKeys.slice().sort();
        return declaredDepKeys.join(',') === sortedDeclaredDepKeys.join(',');
      }
      if (areDeclaredDepsAlphabetized()) {
        suggestedDependencies.sort();
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
            "because mutating them doesn't re-render the component.";
        } else if (externalDependencies.size > 0) {
          const dep = Array.from(externalDependencies)[0];
          // Don't show this warning for things that likely just got moved *inside* the callback
          // because in that case they're clearly not referring to globals.
          if (!scope.set.has(dep)) {
            extraWarning =
              ` Outer scope values like '${dep}' aren't valid dependencies ` +
              `because mutating them doesn't re-render the component.`;
          }
        }
      }

      // `props.foo()` marks `props` as a dependency because it has
      // a `this` value. This warning can be confusing.
      // So if we're going to show it, append a clarification.
      if (!extraWarning && missingDependencies.has('props')) {
        let propDep = dependencies.get('props');
        if (propDep == null) {
          return;
        }
        const refs = propDep.references;
        if (!Array.isArray(refs)) {
          return;
        }
        let isPropsOnlyUsedInMembers = true;
        for (let i = 0; i < refs.length; i++) {
          const ref = refs[i];
          const id = fastFindReferenceWithParent(
            componentScope.block,
            ref.identifier,
          );
          if (!id) {
            isPropsOnlyUsedInMembers = false;
            break;
          }
          const parent = id.parent;
          if (parent == null) {
            isPropsOnlyUsedInMembers = false;
            break;
          }
          if (parent.type !== 'MemberExpression') {
            isPropsOnlyUsedInMembers = false;
            break;
          }
        }
        if (isPropsOnlyUsedInMembers) {
          extraWarning =
            ` However, 'props' will change when *any* prop changes, so the ` +
            `preferred fix is to destructure the 'props' object outside of ` +
            `the ${reactiveHookName} call and refer to those specific props ` +
            `inside ${context.getSource(reactiveHook)}.`;
        }
      }

      if (!extraWarning && missingDependencies.size > 0) {
        // See if the user is trying to avoid specifying a callable prop.
        // This usually means they're unaware of useCallback.
        let missingCallbackDep = null;
        missingDependencies.forEach(missingDep => {
          if (missingCallbackDep) {
            return;
          }
          // Is this a variable from top scope?
          const topScopeRef = componentScope.set.get(missingDep);
          const usedDep = dependencies.get(missingDep);
          if (usedDep.references[0].resolved !== topScopeRef) {
            return;
          }
          // Is this a destructured prop?
          const def = topScopeRef.defs[0];
          if (def == null || def.name == null || def.type !== 'Parameter') {
            return;
          }
          // Was it called in at least one case? Then it's a function.
          let isFunctionCall = false;
          let id;
          for (let i = 0; i < usedDep.references.length; i++) {
            id = usedDep.references[i].identifier;
            if (
              id != null &&
              id.parent != null &&
              id.parent.type === 'CallExpression' &&
              id.parent.callee === id
            ) {
              isFunctionCall = true;
              break;
            }
          }
          if (!isFunctionCall) {
            return;
          }
          // If it's missing (i.e. in component scope) *and* it's a parameter
          // then it is definitely coming from props destructuring.
          // (It could also be props itself but we wouldn't be calling it then.)
          missingCallbackDep = missingDep;
        });
        if (missingCallbackDep !== null) {
          extraWarning =
            ` If '${missingCallbackDep}' changes too often, ` +
            `find the parent component that defines it ` +
            `and wrap that definition in useCallback.`;
        }
      }

      if (!extraWarning && missingDependencies.size > 0) {
        let setStateRecommendation = null;
        missingDependencies.forEach(missingDep => {
          if (setStateRecommendation !== null) {
            return;
          }
          const usedDep = dependencies.get(missingDep);
          const references = usedDep.references;
          let id;
          let maybeCall;
          for (let i = 0; i < references.length; i++) {
            id = references[i].identifier;
            maybeCall = id.parent;
            // Try to see if we have setState(someExpr(missingDep)).
            while (maybeCall != null && maybeCall !== componentScope.block) {
              if (maybeCall.type === 'CallExpression') {
                const correspondingStateVariable = setStateCallSites.get(
                  maybeCall.callee,
                );
                if (correspondingStateVariable != null) {
                  if (correspondingStateVariable.name === missingDep) {
                    // setCount(count + 1)
                    setStateRecommendation = {
                      missingDep,
                      setter: maybeCall.callee.name,
                      form: 'updater',
                    };
                  } else if (stateVariables.has(id)) {
                    // setCount(count + increment)
                    setStateRecommendation = {
                      missingDep,
                      setter: maybeCall.callee.name,
                      form: 'reducer',
                    };
                  } else {
                    const resolved = references[i].resolved;
                    if (resolved != null) {
                      // If it's a parameter *and* a missing dep,
                      // it must be a prop or something inside a prop.
                      // Therefore, recommend an inline reducer.
                      const def = resolved.defs[0];
                      if (def != null && def.type === 'Parameter') {
                        setStateRecommendation = {
                          missingDep,
                          setter: maybeCall.callee.name,
                          form: 'inlineReducer',
                        };
                      }
                    }
                  }
                  break;
                }
              }
              maybeCall = maybeCall.parent;
            }
            if (setStateRecommendation !== null) {
              break;
            }
          }
        });
        if (setStateRecommendation !== null) {
          switch (setStateRecommendation.form) {
            case 'reducer':
              extraWarning =
                ` You can also replace multiple useState variables with useReducer ` +
                `if '${setStateRecommendation.setter}' needs the ` +
                `current value of '${setStateRecommendation.missingDep}'.`;
              break;
            case 'inlineReducer':
              extraWarning =
                ` If '${setStateRecommendation.setter}' needs the ` +
                `current value of '${setStateRecommendation.missingDep}', ` +
                `you can also switch to useReducer instead of useState and ` +
                `read '${setStateRecommendation.missingDep}' in the reducer.`;
              break;
            case 'updater':
              extraWarning =
                ` You can also do a functional update '${
                  setStateRecommendation.setter
                }(${setStateRecommendation.missingDep.substring(
                  0,
                  1,
                )} => ...)' if you only need '${
                  setStateRecommendation.missingDep
                }'` + ` in the '${setStateRecommendation.setter}' call.`;
              break;
            default:
              throw new Error('Unknown case.');
          }
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

// The meat of the logic.
function collectRecommendations({
  dependencies,
  declaredDependencies,
  optionalDependencies,
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
      isRequired: false, // True if used in code
      isSatisfiedRecursively: false, // True if specified in deps
      hasRequiredNodesBelow: false, // True if something deeper is used by code
      children: new Map(), // Nodes for properties
    };
  }

  // Mark all required nodes first.
  // Imagine exclamation marks next to each used deep property.
  dependencies.forEach((_, key) => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isRequired = true;
    markAllParentsByPath(depTree, key, parent => {
      parent.hasRequiredNodesBelow = true;
    });
  });

  // Mark all satisfied nodes.
  // Imagine checkmarks next to each declared dependency.
  declaredDependencies.forEach(({key}) => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isSatisfiedRecursively = true;
  });
  optionalDependencies.forEach(key => {
    const node = getOrCreateNodeByPath(depTree, key);
    node.isSatisfiedRecursively = true;
  });

  // Tree manipulation helpers.
  function getOrCreateNodeByPath(rootNode, path) {
    let keys = path.split('.');
    let node = rootNode;
    for (let key of keys) {
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
    let keys = path.split('.');
    let node = rootNode;
    for (let key of keys) {
      let child = node.children.get(key);
      if (!child) {
        return;
      }
      fn(child);
      node = child;
    }
  }

  // Now we can learn which dependencies are missing or necessary.
  let missingDependencies = new Set();
  let satisfyingDependencies = new Set();
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
        if (child.hasRequiredNodesBelow) {
          // Remember this dep actually satisfied something.
          satisfyingPaths.add(path);
        }
        // It doesn't matter if there's something deeper.
        // It would be transitively satisfied since we assume immutability.
        // `props.foo` is enough if you read `props.foo.id`.
        return;
      }
      if (child.isRequired) {
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
  let suggestedDependencies = [];
  let unnecessaryDependencies = new Set();
  let duplicateDependencies = new Set();
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

// Finds functions declared as dependencies
// that would invalidate on every render.
function scanForDeclaredBareFunctions({
  declaredDependencies,
  declaredDependenciesNode,
  componentScope,
  scope,
}) {
  const bareFunctions = declaredDependencies
    .map(({key}) => {
      const fnRef = componentScope.set.get(key);
      if (fnRef == null) {
        return null;
      }
      let fnNode = fnRef.defs[0];
      if (fnNode == null) {
        return null;
      }
      // const handleChange = function () {}
      // const handleChange = () => {}
      if (
        fnNode.type === 'Variable' &&
        fnNode.node.type === 'VariableDeclarator' &&
        fnNode.node.init != null &&
        (fnNode.node.init.type === 'ArrowFunctionExpression' ||
          fnNode.node.init.type === 'FunctionExpression')
      ) {
        return fnRef;
      }
      // function handleChange() {}
      if (
        fnNode.type === 'FunctionName' &&
        fnNode.node.type === 'FunctionDeclaration'
      ) {
        return fnRef;
      }
      return null;
    })
    .filter(Boolean);

  function isUsedOutsideOfHook(fnRef) {
    let foundWriteExpr = false;
    for (let i = 0; i < fnRef.references.length; i++) {
      const reference = fnRef.references[i];
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

  return bareFunctions.map(fnRef => ({
    fn: fnRef.defs[0],
    suggestUseCallback: isUsedOutsideOfHook(fnRef),
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
    return getDependency(node.parent);
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
