/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global BigInt */
/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

/**
 * Catch all identifiers that begin with "use" followed by an uppercase Latin
 * character to exclude identifiers like "user".
 */

function isHookName(s) {
  return /^use[A-Z0-9].*$/.test(s);
}

/**
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */

function isHook(node) {
  if (node.type === 'Identifier') {
    return isHookName(node.name);
  } else if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    isHook(node.property)
  ) {
    const obj = node.object;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === 'Identifier' && isPascalCaseNameSpace.test(obj.name);
  } else {
    return false;
  }
}

/**
 * Checks if the node is a React component name. React component names must
 * always start with a non-lowercase letter. So `MyComponent` or `_MyComponent`
 * are valid component names for instance.
 */

function isComponentName(node) {
  if (node.type === 'Identifier') {
    return !/^[a-z]/.test(node.name);
  } else {
    return false;
  }
}

function isReactFunction(node, functionName) {
  return (
    node.name === functionName ||
    (node.type === 'MemberExpression' &&
      node.object.name === 'React' &&
      node.property.name === functionName)
  );
}

/**
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */

function isForwardRefCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, 'forwardRef')
  );
}

/**
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, 'memo')
  );
}

function isInsideComponentOrHook(node) {
  while (node) {
    const functionName = getFunctionName(node);
    if (functionName) {
      if (isComponentName(functionName) || isHook(functionName)) {
        return true;
      }
    }
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      return true;
    }
    node = node.parent;
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforces the Rules of Hooks',
      recommended: true,
      url: 'https://reactjs.org/docs/hooks-rules.html',
    },
  },
  create(context) {
    const codePathReactHooksMapStack = [];
    const codePathSegmentStack = [];
    return {
      // Maintain code segment path stack as we traverse.
      onCodePathSegmentStart: segment => codePathSegmentStack.push(segment),
      onCodePathSegmentEnd: () => codePathSegmentStack.pop(),

      // Maintain code path stack as we traverse.
      onCodePathStart: () => codePathReactHooksMapStack.push(new Map()),

      // Process our code path.
      //
      // Everything is ok if all React Hooks are both reachable from the initial
      // segment and reachable from every final segment.
      onCodePathEnd(codePath, codePathNode) {
        const reactHooksMap = codePathReactHooksMapStack.pop();
        if (reactHooksMap.size === 0) {
          return;
        }

        // All of the segments which are cyclic are recorded in this set.
        const cyclic = new Set();

        /**
         * Count the number of code paths from the start of the function to this
         * segment. For example:
         *
         * ```js
         * function MyComponent() {
         *   if (condition) {
         *     // Segment 1
         *   } else {
         *     // Segment 2
         *   }
         *   // Segment 3
         * }
         * ```
         *
         * Segments 1 and 2 have one path to the beginning of `MyComponent` and
         * segment 3 has two paths to the beginning of `MyComponent` since we
         * could have either taken the path of segment 1 or segment 2.
         *
         * Populates `cyclic` with cyclic segments.
         */

        function countPathsFromStart(segment, pathHistory) {
          const {cache} = countPathsFromStart;
          let paths = cache.get(segment.id);
          const pathList = new Set(pathHistory);

          // If `pathList` includes the current segment then we've found a cycle!
          // We need to fill `cyclic` with all segments inside cycle
          if (pathList.has(segment.id)) {
            const pathArray = [...pathList];
            const cyclicSegments = pathArray.slice(
              pathArray.indexOf(segment.id) + 1,
            );
            for (const cyclicSegment of cyclicSegments) {
              cyclic.add(cyclicSegment);
            }

            return BigInt('0');
          }

          // add the current segment to pathList
          pathList.add(segment.id);

          // We have a cached `paths`. Return it.
          if (paths !== undefined) {
            return paths;
          }

          if (codePath.thrownSegments.includes(segment)) {
            paths = BigInt('0');
          } else if (segment.prevSegments.length === 0) {
            paths = BigInt('1');
          } else {
            paths = BigInt('0');
            for (const prevSegment of segment.prevSegments) {
              paths += countPathsFromStart(prevSegment, pathList);
            }
          }

          // If our segment is reachable then there should be at least one path
          // to it from the start of our code path.
          if (segment.reachable && paths === BigInt('0')) {
            cache.delete(segment.id);
          } else {
            cache.set(segment.id, paths);
          }

          return paths;
        }

        /**
         * Count the number of code paths from this segment to the end of the
         * function. For example:
         *
         * ```js
         * function MyComponent() {
         *   // Segment 1
         *   if (condition) {
         *     // Segment 2
         *   } else {
         *     // Segment 3
         *   }
         * }
         * ```
         *
         * Segments 2 and 3 have one path to the end of `MyComponent` and
         * segment 1 has two paths to the end of `MyComponent` since we could
         * either take the path of segment 1 or segment 2.
         *
         * Populates `cyclic` with cyclic segments.
         */

        function countPathsToEnd(segment, pathHistory) {
          const {cache} = countPathsToEnd;
          let paths = cache.get(segment.id);
          const pathList = new Set(pathHistory);

          // If `pathList` includes the current segment then we've found a cycle!
          // We need to fill `cyclic` with all segments inside cycle
          if (pathList.has(segment.id)) {
            const pathArray = Array.from(pathList);
            const cyclicSegments = pathArray.slice(
              pathArray.indexOf(segment.id) + 1,
            );
            for (const cyclicSegment of cyclicSegments) {
              cyclic.add(cyclicSegment);
            }

            return BigInt('0');
          }

          // add the current segment to pathList
          pathList.add(segment.id);

          // We have a cached `paths`. Return it.
          if (paths !== undefined) {
            return paths;
          }

          if (codePath.thrownSegments.includes(segment)) {
            paths = BigInt('0');
          } else if (segment.nextSegments.length === 0) {
            paths = BigInt('1');
          } else {
            paths = BigInt('0');
            for (const nextSegment of segment.nextSegments) {
              paths += countPathsToEnd(nextSegment, pathList);
            }
          }

          cache.set(segment.id, paths);
          return paths;
        }

        /**
         * Gets the shortest path length to the start of a code path.
         * For example:
         *
         * ```js
         * function MyComponent() {
         *   if (condition) {
         *     // Segment 1
         *   }
         *   // Segment 2
         * }
         * ```
         *
         * There is only one path from segment 1 to the code path start. Its
         * length is one so that is the shortest path.
         *
         * There are two paths from segment 2 to the code path start. One
         * through segment 1 with a length of two and another directly to the
         * start with a length of one. The shortest path has a length of one
         * so we would return that.
         */

        function shortestPathLengthToStart(segment) {
          const {cache} = shortestPathLengthToStart;
          let length = cache.get(segment.id);

          // If `length` is null then we found a cycle! Return infinity since
          // the shortest path is definitely not the one where we looped.
          if (length === null) {
            return Infinity;
          }

          // We have a cached `length`. Return it.
          if (length !== undefined) {
            return length;
          }

          // Compute `length` and cache it. Guarding against cycles.
          cache.set(segment.id, null);
          if (segment.prevSegments.length === 0) {
            length = 1;
          } else {
            length = Infinity;
            for (const prevSegment of segment.prevSegments) {
              const prevLength = shortestPathLengthToStart(prevSegment);
              if (prevLength < length) {
                length = prevLength;
              }
            }
            length += 1;
          }
          cache.set(segment.id, length);
          return length;
        }

        countPathsFromStart.cache = new Map();
        countPathsToEnd.cache = new Map();
        shortestPathLengthToStart.cache = new Map();

        // Count all code paths to the end of our component/hook. Also primes
        // the `countPathsToEnd` cache.
        const allPathsFromStartToEnd = countPathsToEnd(codePath.initialSegment);

        // Gets the function name for our code path. If the function name is
        // `undefined` then we know either that we have an anonymous function
        // expression or our code path is not in a function. In both cases we
        // will want to error since neither are React function components or
        // hook functions - unless it is an anonymous function argument to
        // forwardRef or memo.
        const codePathFunctionName = getFunctionName(codePathNode);

        // This is a valid code path for React hooks if we are directly in a React
        // function component or we are in a hook function.
        const isSomewhereInsideComponentOrHook = isInsideComponentOrHook(
          codePathNode,
        );
        const isDirectlyInsideComponentOrHook = codePathFunctionName
          ? isComponentName(codePathFunctionName) ||
            isHook(codePathFunctionName)
          : isForwardRefCallback(codePathNode) || isMemoCallback(codePathNode);

        // Compute the earliest finalizer level using information from the
        // cache. We expect all reachable final segments to have a cache entry
        // after calling `visitSegment()`.
        let shortestFinalPathLength = Infinity;
        for (const finalSegment of codePath.finalSegments) {
          if (!finalSegment.reachable) {
            continue;
          }
          const length = shortestPathLengthToStart(finalSegment);
          if (length < shortestFinalPathLength) {
            shortestFinalPathLength = length;
          }
        }

        // Make sure all React Hooks pass our lint invariants. Log warnings
        // if not.
        for (const [segment, reactHooks] of reactHooksMap) {
          // NOTE: We could report here that the hook is not reachable, but
          // that would be redundant with more general "no unreachable"
          // lint rules.
          if (!segment.reachable) {
            continue;
          }

          // If there are any final segments with a shorter path to start then
          // we possibly have an early return.
          //
          // If our segment is a final segment itself then siblings could
          // possibly be early returns.
          const possiblyHasEarlyReturn =
            segment.nextSegments.length === 0
              ? shortestFinalPathLength <= shortestPathLengthToStart(segment)
              : shortestFinalPathLength < shortestPathLengthToStart(segment);

          // Count all the paths from the start of our code path to the end of
          // our code path that go _through_ this segment. The critical piece
          // of this is _through_. If we just call `countPathsToEnd(segment)`
          // then we neglect that we may have gone through multiple paths to get
          // to this point! Consider:
          //
          // ```js
          // function MyComponent() {
          //   if (a) {
          //     // Segment 1
          //   } else {
          //     // Segment 2
          //   }
          //   // Segment 3
          //   if (b) {
          //     // Segment 4
          //   } else {
          //     // Segment 5
          //   }
          // }
          // ```
          //
          // In this component we have four code paths:
          //
          // 1. `a = true; b = true`
          // 2. `a = true; b = false`
          // 3. `a = false; b = true`
          // 4. `a = false; b = false`
          //
          // From segment 3 there are two code paths to the end through segment
          // 4 and segment 5. However, we took two paths to get here through
          // segment 1 and segment 2.
          //
          // If we multiply the paths from start (two) by the paths to end (two)
          // for segment 3 we get four. Which is our desired count.
          const pathsFromStartToEnd =
            countPathsFromStart(segment) * countPathsToEnd(segment);

          // Is this hook a part of a cyclic segment?
          const cycled = cyclic.has(segment.id);

          for (const hook of reactHooks) {
            // Report an error if a hook may be called more then once.
            if (cycled) {
              context.report({
                node: hook,
                message:
                  `React Hook "${context.getSource(hook)}" may be executed ` +
                  'more than once. Possibly because it is called in a loop. ' +
                  'React Hooks must be called in the exact same order in ' +
                  'every component render.',
              });
            }

            // If this is not a valid code path for React hooks then we need to
            // log a warning for every hook in this code path.
            //
            // Pick a special message depending on the scope this hook was
            // called in.
            if (isDirectlyInsideComponentOrHook) {
              // Report an error if a hook does not reach all finalizing code
              // path segments.
              //
              // Special case when we think there might be an early return.
              if (!cycled && pathsFromStartToEnd !== allPathsFromStartToEnd) {
                const message =
                  `React Hook "${context.getSource(hook)}" is called ` +
                  'conditionally. React Hooks must be called in the exact ' +
                  'same order in every component render.' +
                  (possiblyHasEarlyReturn
                    ? ' Did you accidentally call a React Hook after an' +
                      ' early return?'
                    : '');
                context.report({node: hook, message});
              }
            } else if (
              codePathNode.parent &&
              (codePathNode.parent.type === 'MethodDefinition' ||
                codePathNode.parent.type === 'ClassProperty') &&
              codePathNode.parent.value === codePathNode
            ) {
              // Custom message for hooks inside a class
              const message =
                `React Hook "${context.getSource(hook)}" cannot be called ` +
                'in a class component. React Hooks must be called in a ' +
                'React function component or a custom React Hook function.';
              context.report({node: hook, message});
            } else if (codePathFunctionName) {
              // Custom message if we found an invalid function name.
              const message =
                `React Hook "${context.getSource(hook)}" is called in ` +
                `function "${context.getSource(codePathFunctionName)}" ` +
                'that is neither a React function component nor a custom ' +
                'React Hook function.' +
                ' React component names must start with an uppercase letter.' +
                ' React Hook names must start with the word "use".';
              context.report({node: hook, message});
            } else if (codePathNode.type === 'Program') {
              // These are dangerous if you have inline requires enabled.
              const message =
                `React Hook "${context.getSource(hook)}" cannot be called ` +
                'at the top level. React Hooks must be called in a ' +
                'React function component or a custom React Hook function.';
              context.report({node: hook, message});
            } else {
              // Assume in all other cases the user called a hook in some
              // random function callback. This should usually be true for
              // anonymous function expressions. Hopefully this is clarifying
              // enough in the common case that the incorrect message in
              // uncommon cases doesn't matter.
              if (isSomewhereInsideComponentOrHook) {
                const message =
                  `React Hook "${context.getSource(hook)}" cannot be called ` +
                  'inside a callback. React Hooks must be called in a ' +
                  'React function component or a custom React Hook function.';
                context.report({node: hook, message});
              }
            }
          }
        }
      },

      // Missed opportunity...We could visit all `Identifier`s instead of all
      // `CallExpression`s and check that _every use_ of a hook name is valid.
      // But that gets complicated and enters type-system territory, so we're
      // only being strict about hook calls for now.
      CallExpression(node) {
        if (isHook(node.callee)) {
          // Add the hook node to a map keyed by the code path segment. We will
          // do full code path analysis at the end of our code path.
          const reactHooksMap = last(codePathReactHooksMapStack);
          const codePathSegment = last(codePathSegmentStack);
          let reactHooks = reactHooksMap.get(codePathSegment);
          if (!reactHooks) {
            reactHooks = [];
            reactHooksMap.set(codePathSegment, reactHooks);
          }
          reactHooks.push(node.callee);
        }
      },
    };
  },
};

/**
 * Gets the static name of a function AST node. For function declarations it is
 * easy. For anonymous function expressions it is much harder. If you search for
 * `IsAnonymousFunctionDefinition()` in the ECMAScript spec you'll find places
 * where JS gives anonymous function expressions names. We roughly detect the
 * same AST nodes with some exceptions to better fit our use case.
 */

function getFunctionName(node) {
  if (
    node.type === 'FunctionDeclaration' ||
    (node.type === 'FunctionExpression' && node.id)
  ) {
    // function useHook() {}
    // const whatever = function useHook() {};
    //
    // Function declaration or function expression names win over any
    // assignment statements or other renames.
    return node.id;
  } else if (
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    if (
      node.parent.type === 'VariableDeclarator' &&
      node.parent.init === node
    ) {
      // const useHook = () => {};
      return node.parent.id;
    } else if (
      node.parent.type === 'AssignmentExpression' &&
      node.parent.right === node &&
      node.parent.operator === '='
    ) {
      // useHook = () => {};
      return node.parent.left;
    } else if (
      node.parent.type === 'Property' &&
      node.parent.value === node &&
      !node.parent.computed
    ) {
      // {useHook: () => {}}
      // {useHook() {}}
      return node.parent.key;

      // NOTE: We could also support `ClassProperty` and `MethodDefinition`
      // here to be pedantic. However, hooks in a class are an anti-pattern. So
      // we don't allow it to error early.
      //
      // class {useHook = () => {}}
      // class {useHook() {}}
    } else if (
      node.parent.type === 'AssignmentPattern' &&
      node.parent.right === node &&
      !node.parent.computed
    ) {
      // const {useHook = () => {}} = {};
      // ({useHook = () => {}} = {});
      //
      // Kinda clowny, but we'd said we'd follow spec convention for
      // `IsAnonymousFunctionDefinition()` usage.
      return node.parent.left;
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

/**
 * Convenience function for peeking the last item in a stack.
 */

function last(array) {
  return array[array.length - 1];
}
