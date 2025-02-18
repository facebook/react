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

'use strict';

if (process.env.NODE_ENV !== "production") {
  (function() {
'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */


function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || from);
}

/* eslint-disable no-for-of-loops/no-for-of-loops */
/**
 * Catch all identifiers that begin with "use" followed by an uppercase Latin
 * character to exclude identifiers like "user".
 */
function isHookName(s) {
    return s === 'use' || /^use[A-Z0-9]/.test(s);
}
/**
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */
function isHook(node) {
    if (node.type === 'Identifier') {
        return isHookName(node.name);
    }
    else if (node.type === 'MemberExpression' &&
        !node.computed &&
        isHook(node.property)) {
        var obj = node.object;
        var isPascalCaseNameSpace = /^[A-Z].*/;
        return obj.type === 'Identifier' && isPascalCaseNameSpace.test(obj.name);
    }
    else {
        return false;
    }
}
/**
 * Checks if the node is a React component name. React component names must
 * always start with an uppercase letter.
 */
function isComponentName(node) {
    return node.type === 'Identifier' && /^[A-Z]/.test(node.name);
}
function isReactFunction(node, functionName) {
    return (('name' in node && node.name === functionName) ||
        (node.type === 'MemberExpression' &&
            'name' in node.object &&
            node.object.name === 'React' &&
            'name' in node.property &&
            node.property.name === functionName));
}
/**
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */
function isForwardRefCallback(node) {
    return !!(node.parent &&
        'callee' in node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, 'forwardRef'));
}
/**
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */
function isMemoCallback(node) {
    return !!(node.parent &&
        'callee' in node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, 'memo'));
}
function isInsideComponentOrHook(node) {
    while (node) {
        var functionName = getFunctionName(node);
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
function isInsideDoWhileLoop(node) {
    while (node) {
        if (node.type === 'DoWhileStatement') {
            return true;
        }
        node = node.parent;
    }
    return false;
}
function isUseEffectEventIdentifier$1(node) {
    {
        return node.type === 'Identifier' && node.name === 'useEffectEvent';
    }
}
function isUseIdentifier(node) {
    return isReactFunction(node, 'use');
}
var rule$1 = {
    meta: {
        type: 'problem',
        docs: {
            description: 'enforces the Rules of Hooks',
            recommended: true,
            url: 'https://reactjs.org/docs/hooks-rules.html',
        },
    },
    create: function (context) {
        var lastEffect = null;
        var codePathReactHooksMapStack = [];
        var codePathSegmentStack = [];
        var useEffectEventFunctions = new WeakSet();
        // For a given scope, iterate through the references and add all useEffectEvent definitions. We can
        // do this in non-Program nodes because we can rely on the assumption that useEffectEvent functions
        // can only be declared within a component or hook at its top level.
        function recordAllUseEffectEventFunctions(scope) {
            var e_1, _a, e_2, _b;
            try {
                for (var _c = __values(scope.references), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var reference = _d.value;
                    var parent = reference.identifier.parent;
                    if ((parent === null || parent === void 0 ? void 0 : parent.type) === 'VariableDeclarator' &&
                        parent.init &&
                        parent.init.type === 'CallExpression' &&
                        parent.init.callee &&
                        isUseEffectEventIdentifier$1(parent.init.callee)) {
                        if (reference.resolved === null) {
                            throw new Error('Unexpected null reference.resolved');
                        }
                        try {
                            for (var _e = (e_2 = void 0, __values(reference.resolved.references)), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var ref = _f.value;
                                if (ref !== reference) {
                                    useEffectEventFunctions.add(ref.identifier);
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        /**
         * SourceCode that also works down to ESLint 3.0.0
         */
        var getSourceCode = typeof context.getSourceCode === 'function'
            ? function () {
                return context.getSourceCode();
            }
            : function () {
                return context.sourceCode;
            };
        /**
         * SourceCode#getScope that also works down to ESLint 3.0.0
         */
        var getScope = typeof context.getScope === 'function'
            ? function () {
                return context.getScope();
            }
            : function (node) {
                return getSourceCode().getScope(node);
            };
        return {
            // Maintain code segment path stack as we traverse.
            onCodePathSegmentStart: function (segment) { return codePathSegmentStack.push(segment); },
            onCodePathSegmentEnd: function () { return codePathSegmentStack.pop(); },
            // Maintain code path stack as we traverse.
            onCodePathStart: function () {
                return codePathReactHooksMapStack.push(new Map());
            },
            // Process our code path.
            //
            // Everything is ok if all React Hooks are both reachable from the initial
            // segment and reachable from every final segment.
            onCodePathEnd: function (codePath, codePathNode) {
                var e_3, _a, e_4, _b, e_5, _c;
                var reactHooksMap = codePathReactHooksMapStack.pop();
                if ((reactHooksMap === null || reactHooksMap === void 0 ? void 0 : reactHooksMap.size) === 0) {
                    return;
                }
                else if (typeof reactHooksMap === 'undefined') {
                    throw new Error('Unexpected undefined reactHooksMap');
                }
                // All of the segments which are cyclic are recorded in this set.
                var cyclic = new Set();
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
                    var e_6, _a, e_7, _b;
                    var cache = countPathsFromStart.cache;
                    var paths = cache.get(segment.id);
                    var pathList = new Set(pathHistory);
                    // If `pathList` includes the current segment then we've found a cycle!
                    // We need to fill `cyclic` with all segments inside cycle
                    if (pathList.has(segment.id)) {
                        var pathArray = __spreadArray([], __read(pathList), false);
                        var cyclicSegments = pathArray.slice(pathArray.indexOf(segment.id) + 1);
                        try {
                            for (var cyclicSegments_1 = __values(cyclicSegments), cyclicSegments_1_1 = cyclicSegments_1.next(); !cyclicSegments_1_1.done; cyclicSegments_1_1 = cyclicSegments_1.next()) {
                                var cyclicSegment = cyclicSegments_1_1.value;
                                cyclic.add(cyclicSegment);
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (cyclicSegments_1_1 && !cyclicSegments_1_1.done && (_a = cyclicSegments_1.return)) _a.call(cyclicSegments_1);
                            }
                            finally { if (e_6) throw e_6.error; }
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
                    }
                    else if (segment.prevSegments.length === 0) {
                        paths = BigInt('1');
                    }
                    else {
                        paths = BigInt('0');
                        try {
                            for (var _c = __values(segment.prevSegments), _d = _c.next(); !_d.done; _d = _c.next()) {
                                var prevSegment = _d.value;
                                paths += countPathsFromStart(prevSegment, pathList);
                            }
                        }
                        catch (e_7_1) { e_7 = { error: e_7_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                            }
                            finally { if (e_7) throw e_7.error; }
                        }
                    }
                    // If our segment is reachable then there should be at least one path
                    // to it from the start of our code path.
                    if (segment.reachable && paths === BigInt('0')) {
                        cache.delete(segment.id);
                    }
                    else {
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
                    var e_8, _a, e_9, _b;
                    var cache = countPathsToEnd.cache;
                    var paths = cache.get(segment.id);
                    var pathList = new Set(pathHistory);
                    // If `pathList` includes the current segment then we've found a cycle!
                    // We need to fill `cyclic` with all segments inside cycle
                    if (pathList.has(segment.id)) {
                        var pathArray = Array.from(pathList);
                        var cyclicSegments = pathArray.slice(pathArray.indexOf(segment.id) + 1);
                        try {
                            for (var cyclicSegments_2 = __values(cyclicSegments), cyclicSegments_2_1 = cyclicSegments_2.next(); !cyclicSegments_2_1.done; cyclicSegments_2_1 = cyclicSegments_2.next()) {
                                var cyclicSegment = cyclicSegments_2_1.value;
                                cyclic.add(cyclicSegment);
                            }
                        }
                        catch (e_8_1) { e_8 = { error: e_8_1 }; }
                        finally {
                            try {
                                if (cyclicSegments_2_1 && !cyclicSegments_2_1.done && (_a = cyclicSegments_2.return)) _a.call(cyclicSegments_2);
                            }
                            finally { if (e_8) throw e_8.error; }
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
                    }
                    else if (segment.nextSegments.length === 0) {
                        paths = BigInt('1');
                    }
                    else {
                        paths = BigInt('0');
                        try {
                            for (var _c = __values(segment.nextSegments), _d = _c.next(); !_d.done; _d = _c.next()) {
                                var nextSegment = _d.value;
                                paths += countPathsToEnd(nextSegment, pathList);
                            }
                        }
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                            }
                            finally { if (e_9) throw e_9.error; }
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
                    var e_10, _a;
                    var cache = shortestPathLengthToStart.cache;
                    var length = cache.get(segment.id);
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
                    }
                    else {
                        length = Infinity;
                        try {
                            for (var _b = __values(segment.prevSegments), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var prevSegment = _c.value;
                                var prevLength = shortestPathLengthToStart(prevSegment);
                                if (prevLength < length) {
                                    length = prevLength;
                                }
                            }
                        }
                        catch (e_10_1) { e_10 = { error: e_10_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_10) throw e_10.error; }
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
                var allPathsFromStartToEnd = countPathsToEnd(codePath.initialSegment);
                // Gets the function name for our code path. If the function name is
                // `undefined` then we know either that we have an anonymous function
                // expression or our code path is not in a function. In both cases we
                // will want to error since neither are React function components or
                // hook functions - unless it is an anonymous function argument to
                // forwardRef or memo.
                var codePathFunctionName = getFunctionName(codePathNode);
                // This is a valid code path for React hooks if we are directly in a React
                // function component or we are in a hook function.
                var isSomewhereInsideComponentOrHook = isInsideComponentOrHook(codePathNode);
                var isDirectlyInsideComponentOrHook = codePathFunctionName
                    ? isComponentName(codePathFunctionName) ||
                        isHook(codePathFunctionName)
                    : isForwardRefCallback(codePathNode) || isMemoCallback(codePathNode);
                // Compute the earliest finalizer level using information from the
                // cache. We expect all reachable final segments to have a cache entry
                // after calling `visitSegment()`.
                var shortestFinalPathLength = Infinity;
                try {
                    for (var _d = __values(codePath.finalSegments), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var finalSegment = _e.value;
                        if (!finalSegment.reachable) {
                            continue;
                        }
                        var length = shortestPathLengthToStart(finalSegment);
                        if (length < shortestFinalPathLength) {
                            shortestFinalPathLength = length;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                try {
                    // Make sure all React Hooks pass our lint invariants. Log warnings
                    // if not.
                    for (var reactHooksMap_1 = __values(reactHooksMap), reactHooksMap_1_1 = reactHooksMap_1.next(); !reactHooksMap_1_1.done; reactHooksMap_1_1 = reactHooksMap_1.next()) {
                        var _f = __read(reactHooksMap_1_1.value, 2), segment = _f[0], reactHooks = _f[1];
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
                        var possiblyHasEarlyReturn = segment.nextSegments.length === 0
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
                        var pathsFromStartToEnd = countPathsFromStart(segment) * countPathsToEnd(segment);
                        // Is this hook a part of a cyclic segment?
                        var cycled = cyclic.has(segment.id);
                        try {
                            for (var reactHooks_1 = (e_5 = void 0, __values(reactHooks)), reactHooks_1_1 = reactHooks_1.next(); !reactHooks_1_1.done; reactHooks_1_1 = reactHooks_1.next()) {
                                var hook = reactHooks_1_1.value;
                                // Report an error if a hook may be called more then once.
                                // `use(...)` can be called in loops.
                                if ((cycled || isInsideDoWhileLoop(hook)) &&
                                    !isUseIdentifier(hook)) {
                                    context.report({
                                        node: hook,
                                        message: "React Hook \"".concat(getSourceCode().getText(hook), "\" may be executed ") +
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
                                    // Report an error if the hook is called inside an async function.
                                    // @ts-expect-error the above check hasn't properly type-narrowed `codePathNode` (async doesn't exist on Node)
                                    var isAsyncFunction = codePathNode.async;
                                    if (isAsyncFunction) {
                                        context.report({
                                            node: hook,
                                            message: "React Hook \"".concat(getSourceCode().getText(hook), "\" cannot be ") +
                                                'called in an async function.',
                                        });
                                    }
                                    // Report an error if a hook does not reach all finalizing code
                                    // path segments.
                                    //
                                    // Special case when we think there might be an early return.
                                    if (!cycled &&
                                        pathsFromStartToEnd !== allPathsFromStartToEnd &&
                                        !isUseIdentifier(hook) && // `use(...)` can be called conditionally.
                                        !isInsideDoWhileLoop(hook) // wrapping do/while loops are checked separately.
                                    ) {
                                        var message = "React Hook \"".concat(getSourceCode().getText(hook), "\" is called ") +
                                            'conditionally. React Hooks must be called in the exact ' +
                                            'same order in every component render.' +
                                            (possiblyHasEarlyReturn
                                                ? ' Did you accidentally call a React Hook after an' +
                                                    ' early return?'
                                                : '');
                                        context.report({ node: hook, message: message });
                                    }
                                }
                                else if (codePathNode.parent != null &&
                                    (codePathNode.parent.type === 'MethodDefinition' ||
                                        // @ts-expect-error `ClassProperty` was removed from typescript-estree in https://github.com/typescript-eslint/typescript-eslint/pull/3806
                                        codePathNode.parent.type === 'ClassProperty' ||
                                        codePathNode.parent.type === 'PropertyDefinition') &&
                                    codePathNode.parent.value === codePathNode) {
                                    // Custom message for hooks inside a class
                                    var message = "React Hook \"".concat(getSourceCode().getText(hook), "\" cannot be called ") +
                                        'in a class component. React Hooks must be called in a ' +
                                        'React function component or a custom React Hook function.';
                                    context.report({ node: hook, message: message });
                                }
                                else if (codePathFunctionName) {
                                    // Custom message if we found an invalid function name.
                                    var message = "React Hook \"".concat(getSourceCode().getText(hook), "\" is called in ") +
                                        "function \"".concat(getSourceCode().getText(codePathFunctionName), "\" ") +
                                        'that is neither a React function component nor a custom ' +
                                        'React Hook function.' +
                                        ' React component names must start with an uppercase letter.' +
                                        ' React Hook names must start with the word "use".';
                                    context.report({ node: hook, message: message });
                                }
                                else if (codePathNode.type === 'Program') {
                                    // These are dangerous if you have inline requires enabled.
                                    var message = "React Hook \"".concat(getSourceCode().getText(hook), "\" cannot be called ") +
                                        'at the top level. React Hooks must be called in a ' +
                                        'React function component or a custom React Hook function.';
                                    context.report({ node: hook, message: message });
                                }
                                else {
                                    // Assume in all other cases the user called a hook in some
                                    // random function callback. This should usually be true for
                                    // anonymous function expressions. Hopefully this is clarifying
                                    // enough in the common case that the incorrect message in
                                    // uncommon cases doesn't matter.
                                    // `use(...)` can be called in callbacks.
                                    if (isSomewhereInsideComponentOrHook && !isUseIdentifier(hook)) {
                                        var message = "React Hook \"".concat(getSourceCode().getText(hook), "\" cannot be called ") +
                                            'inside a callback. React Hooks must be called in a ' +
                                            'React function component or a custom React Hook function.';
                                        context.report({ node: hook, message: message });
                                    }
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (reactHooks_1_1 && !reactHooks_1_1.done && (_c = reactHooks_1.return)) _c.call(reactHooks_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (reactHooksMap_1_1 && !reactHooksMap_1_1.done && (_b = reactHooksMap_1.return)) _b.call(reactHooksMap_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            },
            // Missed opportunity...We could visit all `Identifier`s instead of all
            // `CallExpression`s and check that _every use_ of a hook name is valid.
            // But that gets complicated and enters type-system territory, so we're
            // only being strict about hook calls for now.
            CallExpression: function (node) {
                if (isHook(node.callee)) {
                    // Add the hook node to a map keyed by the code path segment. We will
                    // do full code path analysis at the end of our code path.
                    var reactHooksMap = last(codePathReactHooksMapStack);
                    var codePathSegment = last(codePathSegmentStack);
                    var reactHooks = reactHooksMap.get(codePathSegment);
                    if (!reactHooks) {
                        reactHooks = [];
                        reactHooksMap.set(codePathSegment, reactHooks);
                    }
                    reactHooks.push(node.callee);
                }
                // useEffectEvent: useEffectEvent functions can be passed by reference within useEffect as well as in
                // another useEffectEvent
                if (node.callee.type === 'Identifier' &&
                    (node.callee.name === 'useEffect' ||
                        isUseEffectEventIdentifier$1(node.callee)) &&
                    node.arguments.length > 0) {
                    // Denote that we have traversed into a useEffect call, and stash the CallExpr for
                    // comparison later when we exit
                    lastEffect = node;
                }
            },
            Identifier: function (node) {
                // This identifier resolves to a useEffectEvent function, but isn't being referenced in an
                // effect or another event function. It isn't being called either.
                if (lastEffect == null &&
                    useEffectEventFunctions.has(node) &&
                    node.parent.type !== 'CallExpression') {
                    context.report({
                        node: node,
                        message: "`".concat(getSourceCode().getText(node), "` is a function created with React Hook \"useEffectEvent\", and can only be called from ") +
                            'the same component. They cannot be assigned to variables or passed down.',
                    });
                }
            },
            'CallExpression:exit': function (node) {
                if (node === lastEffect) {
                    lastEffect = null;
                }
            },
            FunctionDeclaration: function (node) {
                // function MyComponent() { const onClick = useEffectEvent(...) }
                if (isInsideComponentOrHook(node)) {
                    recordAllUseEffectEventFunctions(getScope(node));
                }
            },
            ArrowFunctionExpression: function (node) {
                // const MyComponent = () => { const onClick = useEffectEvent(...) }
                if (isInsideComponentOrHook(node)) {
                    recordAllUseEffectEventFunctions(getScope(node));
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
    var _a, _b, _c, _d;
    if (node.type === 'FunctionDeclaration' ||
        (node.type === 'FunctionExpression' && node.id)) {
        // function useHook() {}
        // const whatever = function useHook() {};
        //
        // Function declaration or function expression names win over any
        // assignment statements or other renames.
        return node.id;
    }
    else if (node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {
        if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === 'VariableDeclarator' &&
            node.parent.init === node) {
            // const useHook = () => {};
            return node.parent.id;
        }
        else if (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.type) === 'AssignmentExpression' &&
            node.parent.right === node &&
            node.parent.operator === '=') {
            // useHook = () => {};
            return node.parent.left;
        }
        else if (((_c = node.parent) === null || _c === void 0 ? void 0 : _c.type) === 'Property' &&
            node.parent.value === node &&
            !node.parent.computed) {
            // {useHook: () => {}}
            // {useHook() {}}
            return node.parent.key;
            // NOTE: We could also support `ClassProperty` and `MethodDefinition`
            // here to be pedantic. However, hooks in a class are an anti-pattern. So
            // we don't allow it to error early.
            //
            // class {useHook = () => {}}
            // class {useHook() {}}
        }
        else if (((_d = node.parent) === null || _d === void 0 ? void 0 : _d.type) === 'AssignmentPattern' &&
            node.parent.right === node &&
            // @ts-expect-error Property computed does not exist on type `AssignmentPattern`.
            !node.parent.computed) {
            // const {useHook = () => {}} = {};
            // ({useHook = () => {}} = {});
            //
            // Kinda clowny, but we'd said we'd follow spec convention for
            // `IsAnonymousFunctionDefinition()` usage.
            return node.parent.left;
        }
        else {
            return undefined;
        }
    }
    else {
        return undefined;
    }
}
/**
 * Convenience function for peeking the last item in a stack.
 */
function last(array) {
    return array[array.length - 1];
}

var rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'verifies the list of dependencies for Hooks like useEffect and similar',
            recommended: true,
            url: 'https://github.com/facebook/react/issues/14920',
        },
        fixable: 'code',
        hasSuggestions: true,
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                enableDangerousAutofixThisMayCauseInfiniteLoops: false,
                properties: {
                    additionalHooks: {
                        type: 'string',
                    },
                    enableDangerousAutofixThisMayCauseInfiniteLoops: {
                        type: 'boolean',
                    },
                },
            },
        ],
    },
    create: function (context) {
        // Parse the `additionalHooks` regex.
        var additionalHooks = context.options &&
            context.options[0] &&
            context.options[0].additionalHooks
            ? new RegExp(context.options[0].additionalHooks)
            : undefined;
        var enableDangerousAutofixThisMayCauseInfiniteLoops = (context.options &&
            context.options[0] &&
            context.options[0].enableDangerousAutofixThisMayCauseInfiniteLoops) ||
            false;
        var options = {
            additionalHooks: additionalHooks,
            enableDangerousAutofixThisMayCauseInfiniteLoops: enableDangerousAutofixThisMayCauseInfiniteLoops,
        };
        function reportProblem(problem) {
            if (enableDangerousAutofixThisMayCauseInfiniteLoops) {
                // Used to enable legacy behavior. Dangerous.
                // Keep this as an option until major IDEs upgrade (including VSCode FB ESLint extension).
                if (Array.isArray(problem.suggest) &&
                    problem.suggest.length > 0 &&
                    problem.suggest[0]) {
                    problem.fix = problem.suggest[0].fix;
                }
            }
            context.report(problem);
        }
        /**
         * SourceCode that also works down to ESLint 3.0.0
         */
        var getSourceCode = typeof context.getSourceCode === 'function'
            ? function () {
                return context.getSourceCode();
            }
            : function () {
                return context.sourceCode;
            };
        /**
         * SourceCode#getScope that also works down to ESLint 3.0.0
         */
        var getScope = typeof context.getScope === 'function'
            ? function () {
                return context.getScope();
            }
            : function (node) {
                return context.sourceCode.getScope(node);
            };
        var scopeManager = getSourceCode().scopeManager;
        // Should be shared between visitors.
        var setStateCallSites = new WeakMap();
        var stateVariables = new WeakSet();
        var stableKnownValueCache = new WeakMap();
        var functionWithoutCapturedValueCache = new WeakMap();
        var useEffectEventVariables = new WeakSet();
        function memoizeWithWeakMap(fn, map) {
            return function (arg) {
                if (map.has(arg)) {
                    // to verify cache hits:
                    // console.log(arg.name)
                    return map.get(arg);
                }
                var result = fn(arg);
                map.set(arg, result);
                return result;
            };
        }
        /**
         * Visitor for both function expressions and arrow function expressions.
         */
        function visitFunctionWithDependencies(node, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect) {
            var e_1, _a, e_2, _b, e_3, _c;
            if (isEffect && node.async) {
                reportProblem({
                    node: node,
                    message: "Effect callbacks are synchronous to prevent race conditions. " +
                        "Put the async function inside:\n\n" +
                        'useEffect(() => {\n' +
                        '  async function fetchData() {\n' +
                        '    // You can await here\n' +
                        '    const response = await MyAPI.getData(someId);\n' +
                        '    // ...\n' +
                        '  }\n' +
                        '  fetchData();\n' +
                        "}, [someId]); // Or [] if effect doesn't need props or state\n\n" +
                        'Learn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching',
                });
            }
            // Get the current scope.
            var scope = scopeManager.acquire(node);
            if (!scope) {
                throw new Error('Unable to acquire scope for the current node. This is a bug in eslint-plugin-react-hooks, please file an issue.');
            }
            // Find all our "pure scopes". On every re-render of a component these
            // pure scopes may have changes to the variables declared within. So all
            // variables used in our reactive hook callback but declared in a pure
            // scope need to be listed as dependencies of our reactive hook callback.
            //
            // According to the rules of React you can't read a mutable value in pure
            // scope. We can't enforce this in a lint so we trust that all variables
            // declared outside of pure scope are indeed frozen.
            var pureScopes = new Set();
            var componentScope = null;
            {
                var currentScope = scope.upper;
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
            var isArray = Array.isArray;
            // Next we'll define a few helpers that helps us
            // tell if some values don't have to be declared as deps.
            // Some are known to be stable based on Hook calls.
            // const [state, setState] = useState() / React.useState()
            //               ^^^ true for this reference
            // const [state, dispatch] = useReducer() / React.useReducer()
            //               ^^^ true for this reference
            // const [state, dispatch] = useActionState() / React.useActionState()
            //               ^^^ true for this reference
            // const ref = useRef()
            //       ^^^ true for this reference
            // const onStuff = useEffectEvent(() => {})
            //       ^^^ true for this reference
            // False for everything else.
            function isStableKnownHookValue(resolved) {
                var e_4, _a, e_5, _b, e_6, _c;
                if (!isArray(resolved.defs)) {
                    return false;
                }
                var def = resolved.defs[0];
                if (def == null) {
                    return false;
                }
                // Look for `let stuff = ...`
                var defNode = def.node;
                if (defNode.type !== 'VariableDeclarator') {
                    return false;
                }
                var init = defNode.init;
                if (init == null) {
                    return false;
                }
                while (init.type === 'TSAsExpression' || init.type === 'AsExpression') {
                    init = init.expression;
                }
                // Detect primitive constants
                // const foo = 42
                var declaration = defNode.parent;
                if (declaration == null && componentScope != null) {
                    // This might happen if variable is declared after the callback.
                    // In that case ESLint won't set up .parent refs.
                    // So we'll set them up manually.
                    fastFindReferenceWithParent(componentScope.block, def.node.id);
                    declaration = def.node.parent;
                    if (declaration == null) {
                        return false;
                    }
                }
                if (declaration != null &&
                    'kind' in declaration &&
                    declaration.kind === 'const' &&
                    init.type === 'Literal' &&
                    (typeof init.value === 'string' ||
                        typeof init.value === 'number' ||
                        init.value === null)) {
                    // Definitely stable
                    return true;
                }
                // Detect known Hook calls
                // const [_, setState] = useState()
                if (init.type !== 'CallExpression') {
                    return false;
                }
                var callee = init.callee;
                // Step into `= React.something` initializer.
                if (callee.type === 'MemberExpression' &&
                    'name' in callee.object &&
                    callee.object.name === 'React' &&
                    callee.property != null &&
                    !callee.computed) {
                    callee = callee.property;
                }
                if (callee.type !== 'Identifier') {
                    return false;
                }
                var definitionNode = def.node;
                var id = definitionNode.id;
                var name = callee.name;
                if (name === 'useRef' && id.type === 'Identifier') {
                    // useRef() return value is stable.
                    return true;
                }
                else if (isUseEffectEventIdentifier(callee) &&
                    id.type === 'Identifier') {
                    try {
                        for (var _d = __values(resolved.references), _e = _d.next(); !_e.done; _e = _d.next()) {
                            var ref = _e.value;
                            // @ts-expect-error These types are not compatible (Reference and Identifier)
                            if (ref !== id) {
                                useEffectEventVariables.add(ref.identifier);
                            }
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                    // useEffectEvent() return value is always unstable.
                    return true;
                }
                else if (name === 'useState' ||
                    name === 'useReducer' ||
                    name === 'useActionState') {
                    // Only consider second value in initializing tuple stable.
                    if (id.type === 'ArrayPattern' &&
                        id.elements.length === 2 &&
                        isArray(resolved.identifiers)) {
                        // Is second tuple value the same reference we're checking?
                        if (id.elements[1] === resolved.identifiers[0]) {
                            if (name === 'useState') {
                                var references = resolved.references;
                                var writeCount = 0;
                                try {
                                    for (var references_2 = __values(references), references_2_1 = references_2.next(); !references_2_1.done; references_2_1 = references_2.next()) {
                                        var reference = references_2_1.value;
                                        if (reference.isWrite()) {
                                            writeCount++;
                                        }
                                        if (writeCount > 1) {
                                            return false;
                                        }
                                        setStateCallSites.set(reference.identifier, id.elements[0]);
                                    }
                                }
                                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                                finally {
                                    try {
                                        if (references_2_1 && !references_2_1.done && (_b = references_2.return)) _b.call(references_2);
                                    }
                                    finally { if (e_5) throw e_5.error; }
                                }
                            }
                            // Setter is stable.
                            return true;
                        }
                        else if (id.elements[0] === resolved.identifiers[0]) {
                            if (name === 'useState') {
                                var references = resolved.references;
                                try {
                                    for (var references_3 = __values(references), references_3_1 = references_3.next(); !references_3_1.done; references_3_1 = references_3.next()) {
                                        var reference = references_3_1.value;
                                        stateVariables.add(reference.identifier);
                                    }
                                }
                                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                                finally {
                                    try {
                                        if (references_3_1 && !references_3_1.done && (_c = references_3.return)) _c.call(references_3);
                                    }
                                    finally { if (e_6) throw e_6.error; }
                                }
                            }
                            // State variable itself is dynamic.
                            return false;
                        }
                    }
                }
                else if (name === 'useTransition') {
                    // Only consider second value in initializing tuple stable.
                    if (id.type === 'ArrayPattern' &&
                        id.elements.length === 2 &&
                        Array.isArray(resolved.identifiers)) {
                        // Is second tuple value the same reference we're checking?
                        if (id.elements[1] === resolved.identifiers[0]) {
                            // Setter is stable.
                            return true;
                        }
                    }
                }
                // By default assume it's dynamic.
                return false;
            }
            // Some are just functions that don't reference anything dynamic.
            function isFunctionWithoutCapturedValues(resolved) {
                var e_7, _a, e_8, _b;
                if (!isArray(resolved.defs)) {
                    return false;
                }
                var def = resolved.defs[0];
                if (def == null) {
                    return false;
                }
                if (def.node == null || def.node.id == null) {
                    return false;
                }
                // Search the direct component subscopes for
                // top-level function definitions matching this reference.
                var fnNode = def.node;
                var childScopes = (componentScope === null || componentScope === void 0 ? void 0 : componentScope.childScopes) || [];
                var fnScope = null;
                try {
                    for (var childScopes_1 = __values(childScopes), childScopes_1_1 = childScopes_1.next(); !childScopes_1_1.done; childScopes_1_1 = childScopes_1.next()) {
                        var childScope = childScopes_1_1.value;
                        var childScopeBlock = childScope.block;
                        if (
                        // function handleChange() {}
                        (fnNode.type === 'FunctionDeclaration' &&
                            childScopeBlock === fnNode) ||
                            // const handleChange = () => {}
                            // const handleChange = function() {}
                            (fnNode.type === 'VariableDeclarator' &&
                                childScopeBlock.parent === fnNode)) {
                            // Found it!
                            fnScope = childScope;
                            break;
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (childScopes_1_1 && !childScopes_1_1.done && (_a = childScopes_1.return)) _a.call(childScopes_1);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
                if (fnScope == null) {
                    return false;
                }
                try {
                    // Does this function capture any values
                    // that are in pure scopes (aka render)?
                    for (var _c = __values(fnScope.through), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var ref = _d.value;
                        if (ref.resolved == null) {
                            continue;
                        }
                        if (pureScopes.has(ref.resolved.scope) &&
                            // Stable values are fine though,
                            // although we won't check functions deeper.
                            !memoizedIsStableKnownHookValue(ref.resolved)) {
                            return false;
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
                // If we got here, this function doesn't capture anything
                // from render--or everything it captures is known stable.
                return true;
            }
            // Remember such values. Avoid re-running extra checks on them.
            var memoizedIsStableKnownHookValue = memoizeWithWeakMap(isStableKnownHookValue, stableKnownValueCache);
            var memoizedIsFunctionWithoutCapturedValues = memoizeWithWeakMap(isFunctionWithoutCapturedValues, functionWithoutCapturedValueCache);
            // These are usually mistaken. Collect them.
            var currentRefsInEffectCleanup = new Map();
            // Is this reference inside a cleanup function for this effect node?
            // We can check by traversing scopes upwards from the reference, and checking
            // if the last "return () => " we encounter is located directly inside the effect.
            function isInsideEffectCleanup(reference) {
                var curScope = reference.from;
                var isInReturnedFunction = false;
                while (curScope != null && curScope.block !== node) {
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
            // Key is dependency string, value is whether it's stable.
            var dependencies = new Map();
            var optionalChains = new Map();
            gatherDependenciesRecursively(scope);
            function gatherDependenciesRecursively(currentScope) {
                var e_9, _a, e_10, _b;
                var _c, _d, _e, _f, _g;
                try {
                    for (var _h = __values(currentScope.references), _j = _h.next(); !_j.done; _j = _h.next()) {
                        var reference = _j.value;
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
                        var referenceNode = fastFindReferenceWithParent(node, reference.identifier);
                        if (referenceNode == null) {
                            continue;
                        }
                        var dependencyNode = getDependency(referenceNode);
                        var dependency = analyzePropertyChain(dependencyNode, optionalChains);
                        // Accessing ref.current inside effect cleanup is bad.
                        if (
                        // We're in an effect...
                        isEffect &&
                            // ... and this look like accessing .current...
                            dependencyNode.type === 'Identifier' &&
                            (((_c = dependencyNode.parent) === null || _c === void 0 ? void 0 : _c.type) === 'MemberExpression' ||
                                ((_d = dependencyNode.parent) === null || _d === void 0 ? void 0 : _d.type) === 'OptionalMemberExpression') &&
                            !dependencyNode.parent.computed &&
                            dependencyNode.parent.property.type === 'Identifier' &&
                            dependencyNode.parent.property.name === 'current' &&
                            // ...in a cleanup function or below...
                            isInsideEffectCleanup(reference)) {
                            currentRefsInEffectCleanup.set(dependency, {
                                reference: reference,
                                dependencyNode: dependencyNode,
                            });
                        }
                        if (((_e = dependencyNode.parent) === null || _e === void 0 ? void 0 : _e.type) === 'TSTypeQuery' ||
                            ((_f = dependencyNode.parent) === null || _f === void 0 ? void 0 : _f.type) === 'TSTypeReference') {
                            continue;
                        }
                        var def = reference.resolved.defs[0];
                        if (def == null) {
                            continue;
                        }
                        // Ignore references to the function itself as it's not defined yet.
                        if (def.node != null && def.node.init === node.parent) {
                            continue;
                        }
                        // Ignore Flow type parameters
                        // @ts-expect-error We don't have flow types
                        if (def.type === 'TypeParameter') {
                            continue;
                        }
                        // Add the dependency to a map so we can make sure it is referenced
                        // again in our dependencies array. Remember whether it's stable.
                        if (!dependencies.has(dependency)) {
                            var resolved = reference.resolved;
                            var isStable = memoizedIsStableKnownHookValue(resolved) ||
                                memoizedIsFunctionWithoutCapturedValues(resolved);
                            dependencies.set(dependency, {
                                isStable: isStable,
                                references: [reference],
                            });
                        }
                        else {
                            (_g = dependencies.get(dependency)) === null || _g === void 0 ? void 0 : _g.references.push(reference);
                        }
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
                try {
                    for (var _k = __values(currentScope.childScopes), _l = _k.next(); !_l.done; _l = _k.next()) {
                        var childScope = _l.value;
                        gatherDependenciesRecursively(childScope);
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_l && !_l.done && (_b = _k.return)) _b.call(_k);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
            }
            // Warn about accessing .current in cleanup effects.
            currentRefsInEffectCleanup.forEach(function (_a, dependency) {
                var e_11, _b;
                var _c, _d;
                var reference = _a.reference, dependencyNode = _a.dependencyNode;
                var references = ((_c = reference.resolved) === null || _c === void 0 ? void 0 : _c.references) || [];
                // Is React managing this ref or us?
                // Let's see if we can find a .current assignment.
                var foundCurrentAssignment = false;
                try {
                    for (var references_4 = __values(references), references_4_1 = references_4.next(); !references_4_1.done; references_4_1 = references_4.next()) {
                        var ref = references_4_1.value;
                        var identifier = ref.identifier;
                        var parent = identifier.parent;
                        if (parent != null &&
                            // ref.current
                            // Note: no need to handle OptionalMemberExpression because it can't be LHS.
                            parent.type === 'MemberExpression' &&
                            !parent.computed &&
                            parent.property.type === 'Identifier' &&
                            parent.property.name === 'current' &&
                            // ref.current = <something>
                            ((_d = parent.parent) === null || _d === void 0 ? void 0 : _d.type) === 'AssignmentExpression' &&
                            parent.parent.left === parent) {
                            foundCurrentAssignment = true;
                            break;
                        }
                    }
                }
                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                finally {
                    try {
                        if (references_4_1 && !references_4_1.done && (_b = references_4.return)) _b.call(references_4);
                    }
                    finally { if (e_11) throw e_11.error; }
                }
                // We only want to warn about React-managed refs.
                if (foundCurrentAssignment) {
                    return;
                }
                reportProblem({
                    // @ts-expect-error We can do better here (dependencyNode.parent has not been type narrowed)
                    node: dependencyNode.parent.property,
                    message: "The ref value '".concat(dependency, ".current' will likely have ") +
                        "changed by the time this effect cleanup function runs. If " +
                        "this ref points to a node rendered by React, copy " +
                        "'".concat(dependency, ".current' to a variable inside the effect, and ") +
                        "use that variable in the cleanup function.",
                });
            });
            // Warn about assigning to variables in the outer scope.
            // Those are usually bugs.
            var staleAssignments = new Set();
            function reportStaleAssignment(writeExpr, key) {
                if (staleAssignments.has(key)) {
                    return;
                }
                staleAssignments.add(key);
                reportProblem({
                    node: writeExpr,
                    message: "Assignments to the '".concat(key, "' variable from inside React Hook ") +
                        "".concat(getSourceCode().getText(reactiveHook), " will be lost after each ") +
                        "render. To preserve the value over time, store it in a useRef " +
                        "Hook and keep the mutable value in the '.current' property. " +
                        "Otherwise, you can move this variable directly inside " +
                        "".concat(getSourceCode().getText(reactiveHook), "."),
                });
            }
            // Remember which deps are stable and report bad usage first.
            var stableDependencies = new Set();
            dependencies.forEach(function (_a, key) {
                var isStable = _a.isStable, references = _a.references;
                if (isStable) {
                    stableDependencies.add(key);
                }
                references.forEach(function (reference) {
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
                var setStateInsideEffectWithoutDeps_1 = null;
                dependencies.forEach(function (_a, key) {
                    var references = _a.references;
                    if (setStateInsideEffectWithoutDeps_1) {
                        return;
                    }
                    references.forEach(function (reference) {
                        if (setStateInsideEffectWithoutDeps_1) {
                            return;
                        }
                        var id = reference.identifier;
                        var isSetState = setStateCallSites.has(id);
                        if (!isSetState) {
                            return;
                        }
                        var fnScope = reference.from;
                        while (fnScope != null && fnScope.type !== 'function') {
                            fnScope = fnScope.upper;
                        }
                        var isDirectlyInsideEffect = (fnScope === null || fnScope === void 0 ? void 0 : fnScope.block) === node;
                        if (isDirectlyInsideEffect) {
                            // TODO: we could potentially ignore early returns.
                            setStateInsideEffectWithoutDeps_1 = key;
                        }
                    });
                });
                if (setStateInsideEffectWithoutDeps_1) {
                    var suggestedDependencies_1 = collectRecommendations({
                        dependencies: dependencies,
                        declaredDependencies: [],
                        stableDependencies: stableDependencies,
                        externalDependencies: new Set(),
                        isEffect: true,
                    }).suggestedDependencies;
                    reportProblem({
                        node: reactiveHook,
                        message: "React Hook ".concat(reactiveHookName, " contains a call to '").concat(setStateInsideEffectWithoutDeps_1, "'. ") +
                            "Without a list of dependencies, this can lead to an infinite chain of updates. " +
                            "To fix this, pass [" +
                            suggestedDependencies_1.join(', ') +
                            "] as a second argument to the ".concat(reactiveHookName, " Hook."),
                        suggest: [
                            {
                                desc: "Add dependencies array: [".concat(suggestedDependencies_1.join(', '), "]"),
                                fix: function (fixer) {
                                    return fixer.insertTextAfter(node, ", [".concat(suggestedDependencies_1.join(', '), "]"));
                                },
                            },
                        ],
                    });
                }
                return;
            }
            var declaredDependencies = [];
            var externalDependencies = new Set();
            var isArrayExpression = declaredDependenciesNode.type === 'ArrayExpression';
            var isTSAsArrayExpression = declaredDependenciesNode.type === 'TSAsExpression' &&
                declaredDependenciesNode.expression.type === 'ArrayExpression';
            if (!isArrayExpression && !isTSAsArrayExpression) {
                // If the declared dependencies are not an array expression then we
                // can't verify that the user provided the correct dependencies. Tell
                // the user this in an error.
                reportProblem({
                    node: declaredDependenciesNode,
                    message: "React Hook ".concat(getSourceCode().getText(reactiveHook), " was passed a ") +
                        'dependency list that is not an array literal. This means we ' +
                        "can't statically verify whether you've passed the correct " +
                        'dependencies.',
                });
            }
            else {
                var arrayExpression = isTSAsArrayExpression
                    ? declaredDependenciesNode.expression
                    : declaredDependenciesNode;
                arrayExpression.elements.forEach(function (declaredDependencyNode) {
                    // Skip elided elements.
                    if (declaredDependencyNode === null) {
                        return;
                    }
                    // If we see a spread element then add a special warning.
                    if (declaredDependencyNode.type === 'SpreadElement') {
                        reportProblem({
                            node: declaredDependencyNode,
                            message: "React Hook ".concat(getSourceCode().getText(reactiveHook), " has a spread ") +
                                "element in its dependency array. This means we can't " +
                                "statically verify whether you've passed the " +
                                'correct dependencies.',
                        });
                        return;
                    }
                    if (useEffectEventVariables.has(declaredDependencyNode)) {
                        reportProblem({
                            node: declaredDependencyNode,
                            message: 'Functions returned from `useEffectEvent` must not be included in the dependency array. ' +
                                "Remove `".concat(getSourceCode().getText(declaredDependencyNode), "` from the list."),
                            suggest: [
                                {
                                    desc: "Remove the dependency `".concat(getSourceCode().getText(declaredDependencyNode), "`"),
                                    fix: function (fixer) {
                                        return fixer.removeRange(declaredDependencyNode.range);
                                    },
                                },
                            ],
                        });
                    }
                    // Try to normalize the declared dependency. If we can't then an error
                    // will be thrown. We will catch that error and report an error.
                    var declaredDependency;
                    try {
                        declaredDependency = analyzePropertyChain(declaredDependencyNode, null);
                    }
                    catch (error) {
                        if (error instanceof Error &&
                            /Unsupported node type/.test(error.message)) {
                            if (declaredDependencyNode.type === 'Literal') {
                                if (declaredDependencyNode.value &&
                                    dependencies.has(declaredDependencyNode.value)) {
                                    reportProblem({
                                        node: declaredDependencyNode,
                                        message: "The ".concat(declaredDependencyNode.raw, " literal is not a valid dependency ") +
                                            "because it never changes. " +
                                            "Did you mean to include ".concat(declaredDependencyNode.value, " in the array instead?"),
                                    });
                                }
                                else {
                                    reportProblem({
                                        node: declaredDependencyNode,
                                        message: "The ".concat(declaredDependencyNode.raw, " literal is not a valid dependency ") +
                                            'because it never changes. You can safely remove it.',
                                    });
                                }
                            }
                            else {
                                reportProblem({
                                    node: declaredDependencyNode,
                                    message: "React Hook ".concat(getSourceCode().getText(reactiveHook), " has a ") +
                                        "complex expression in the dependency array. " +
                                        'Extract it to a separate variable so it can be statically checked.',
                                });
                            }
                            return;
                        }
                        else {
                            throw error;
                        }
                    }
                    var maybeID = declaredDependencyNode;
                    while (maybeID.type === 'MemberExpression' ||
                        maybeID.type === 'OptionalMemberExpression' ||
                        maybeID.type === 'ChainExpression') {
                        // @ts-expect-error This can be done better
                        maybeID = maybeID.object || maybeID.expression.object;
                    }
                    var isDeclaredInComponent = !componentScope.through.some(function (ref) { return ref.identifier === maybeID; });
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
            var _d = collectRecommendations({
                dependencies: dependencies,
                declaredDependencies: declaredDependencies,
                stableDependencies: stableDependencies,
                externalDependencies: externalDependencies,
                isEffect: isEffect,
            }), suggestedDependencies = _d.suggestedDependencies, unnecessaryDependencies = _d.unnecessaryDependencies, missingDependencies = _d.missingDependencies, duplicateDependencies = _d.duplicateDependencies;
            var suggestedDeps = suggestedDependencies;
            var problemCount = duplicateDependencies.size +
                missingDependencies.size +
                unnecessaryDependencies.size;
            if (problemCount === 0) {
                // If nothing else to report, check if some dependencies would
                // invalidate on every render.
                var constructions = scanForConstructions({
                    declaredDependencies: declaredDependencies,
                    declaredDependenciesNode: declaredDependenciesNode,
                    componentScope: componentScope,
                    scope: scope,
                });
                constructions.forEach(function (_a) {
                    var _b;
                    var construction = _a.construction, isUsedOutsideOfHook = _a.isUsedOutsideOfHook, depType = _a.depType;
                    var wrapperHook = depType === 'function' ? 'useCallback' : 'useMemo';
                    var constructionType = depType === 'function' ? 'definition' : 'initialization';
                    var defaultAdvice = "wrap the ".concat(constructionType, " of '").concat(construction.name.name, "' in its own ").concat(wrapperHook, "() Hook.");
                    var advice = isUsedOutsideOfHook
                        ? "To fix this, ".concat(defaultAdvice)
                        : "Move it inside the ".concat(reactiveHookName, " callback. Alternatively, ").concat(defaultAdvice);
                    var causation = depType === 'conditional' || depType === 'logical expression'
                        ? 'could make'
                        : 'makes';
                    var message = "The '".concat(construction.name.name, "' ").concat(depType, " ").concat(causation, " the dependencies of ") +
                        "".concat(reactiveHookName, " Hook (at line ").concat((_b = declaredDependenciesNode.loc) === null || _b === void 0 ? void 0 : _b.start.line, ") ") +
                        "change on every render. ".concat(advice);
                    var suggest;
                    // Only handle the simple case of variable assignments.
                    // Wrapping function declarations can mess up hoisting.
                    if (isUsedOutsideOfHook &&
                        construction.type === 'Variable' &&
                        // Objects may be mutated after construction, which would make this
                        // fix unsafe. Functions _probably_ won't be mutated, so we'll
                        // allow this fix for them.
                        depType === 'function') {
                        suggest = [
                            {
                                desc: "Wrap the ".concat(constructionType, " of '").concat(construction.name.name, "' in its own ").concat(wrapperHook, "() Hook."),
                                fix: function (fixer) {
                                    var _a = __read(wrapperHook === 'useMemo'
                                        ? ["useMemo(() => { return ", '; })']
                                        : ['useCallback(', ')'], 2), before = _a[0], after = _a[1];
                                    return [
                                        // TODO: also add an import?
                                        fixer.insertTextBefore(construction.node.init, before),
                                        // TODO: ideally we'd gather deps here but it would require
                                        // restructuring the rule code. This will cause a new lint
                                        // error to appear immediately for useCallback. Note we're
                                        // not adding [] because would that changes semantics.
                                        fixer.insertTextAfter(construction.node.init, after),
                                    ];
                                },
                            },
                        ];
                    }
                    // TODO: What if the function needs to change on every render anyway?
                    // Should we suggest removing effect deps as an appropriate fix too?
                    reportProblem({
                        // TODO: Why not report this at the dependency site?
                        node: construction.node,
                        message: message,
                        suggest: suggest,
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
                suggestedDeps = collectRecommendations({
                    dependencies: dependencies,
                    declaredDependencies: [], // Pretend we don't know
                    stableDependencies: stableDependencies,
                    externalDependencies: externalDependencies,
                    isEffect: isEffect,
                }).suggestedDependencies;
            }
            // Alphabetize the suggestions, but only if deps were already alphabetized.
            function areDeclaredDepsAlphabetized() {
                if (declaredDependencies.length === 0) {
                    return true;
                }
                var declaredDepKeys = declaredDependencies.map(function (dep) { return dep.key; });
                var sortedDeclaredDepKeys = declaredDepKeys.slice().sort();
                return declaredDepKeys.join(',') === sortedDeclaredDepKeys.join(',');
            }
            if (areDeclaredDepsAlphabetized()) {
                suggestedDeps.sort();
            }
            // Most of our algorithm deals with dependency paths with optional chaining stripped.
            // This function is the last step before printing a dependency, so now is a good time to
            // check whether any members in our path are always used as optional-only. In that case,
            // we will use ?. instead of . to concatenate those parts of the path.
            function formatDependency(path) {
                var members = path.split('.');
                var finalPath = '';
                for (var i = 0; i < members.length; i++) {
                    if (i !== 0) {
                        var pathSoFar = members.slice(0, i + 1).join('.');
                        var isOptional = optionalChains.get(pathSoFar) === true;
                        finalPath += isOptional ? '?.' : '.';
                    }
                    finalPath += members[i];
                }
                return finalPath;
            }
            function getWarningMessage(deps, singlePrefix, label, fixVerb) {
                if (deps.size === 0) {
                    return null;
                }
                return ((deps.size > 1 ? '' : singlePrefix + ' ') +
                    label +
                    ' ' +
                    (deps.size > 1 ? 'dependencies' : 'dependency') +
                    ': ' +
                    joinEnglish(Array.from(deps)
                        .sort()
                        .map(function (name) { return "'" + formatDependency(name) + "'"; })) +
                    ". Either ".concat(fixVerb, " ").concat(deps.size > 1 ? 'them' : 'it', " or remove the dependency array."));
            }
            var extraWarning = '';
            if (unnecessaryDependencies.size > 0) {
                var badRef_1 = null;
                Array.from(unnecessaryDependencies.keys()).forEach(function (key) {
                    if (badRef_1 !== null) {
                        return;
                    }
                    if (key.endsWith('.current')) {
                        badRef_1 = key;
                    }
                });
                if (badRef_1 !== null) {
                    extraWarning =
                        " Mutable values like '".concat(badRef_1, "' aren't valid dependencies ") +
                            "because mutating them doesn't re-render the component.";
                }
                else if (externalDependencies.size > 0) {
                    var dep = Array.from(externalDependencies)[0];
                    // Don't show this warning for things that likely just got moved *inside* the callback
                    // because in that case they're clearly not referring to globals.
                    if (!scope.set.has(dep)) {
                        extraWarning =
                            " Outer scope values like '".concat(dep, "' aren't valid dependencies ") +
                                "because mutating them doesn't re-render the component.";
                    }
                }
            }
            // `props.foo()` marks `props` as a dependency because it has
            // a `this` value. This warning can be confusing.
            // So if we're going to show it, append a clarification.
            if (!extraWarning && missingDependencies.has('props')) {
                var propDep = dependencies.get('props');
                if (propDep == null) {
                    return;
                }
                var refs = propDep.references;
                if (!Array.isArray(refs)) {
                    return;
                }
                var isPropsOnlyUsedInMembers = true;
                try {
                    for (var refs_1 = __values(refs), refs_1_1 = refs_1.next(); !refs_1_1.done; refs_1_1 = refs_1.next()) {
                        var ref = refs_1_1.value;
                        var id = fastFindReferenceWithParent(componentScope.block, ref.identifier);
                        if (!id) {
                            isPropsOnlyUsedInMembers = false;
                            break;
                        }
                        var parent = id.parent;
                        if (parent == null) {
                            isPropsOnlyUsedInMembers = false;
                            break;
                        }
                        if (parent.type !== 'MemberExpression' &&
                            parent.type !== 'OptionalMemberExpression') {
                            isPropsOnlyUsedInMembers = false;
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (refs_1_1 && !refs_1_1.done && (_a = refs_1.return)) _a.call(refs_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                if (isPropsOnlyUsedInMembers) {
                    extraWarning =
                        " However, 'props' will change when *any* prop changes, so the " +
                            "preferred fix is to destructure the 'props' object outside of " +
                            "the ".concat(reactiveHookName, " call and refer to those specific props ") +
                            "inside ".concat(getSourceCode().getText(reactiveHook), ".");
                }
            }
            if (!extraWarning && missingDependencies.size > 0) {
                // See if the user is trying to avoid specifying a callable prop.
                // This usually means they're unaware of useCallback.
                var missingCallbackDep_1 = null;
                missingDependencies.forEach(function (missingDep) {
                    var e_12, _a;
                    var _b;
                    if (missingCallbackDep_1) {
                        return;
                    }
                    // Is this a variable from top scope?
                    var topScopeRef = componentScope.set.get(missingDep);
                    var usedDep = dependencies.get(missingDep);
                    if (!(usedDep === null || usedDep === void 0 ? void 0 : usedDep.references) ||
                        ((_b = usedDep === null || usedDep === void 0 ? void 0 : usedDep.references[0]) === null || _b === void 0 ? void 0 : _b.resolved) !== topScopeRef) {
                        return;
                    }
                    // Is this a destructured prop?
                    var def = topScopeRef === null || topScopeRef === void 0 ? void 0 : topScopeRef.defs[0];
                    if (def == null || def.name == null || def.type !== 'Parameter') {
                        return;
                    }
                    // Was it called in at least one case? Then it's a function.
                    var isFunctionCall = false;
                    var id;
                    try {
                        for (var _c = __values(usedDep.references), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var reference = _d.value;
                            id = reference.identifier;
                            if (id != null &&
                                id.parent != null &&
                                (id.parent.type === 'CallExpression' ||
                                    id.parent.type === 'OptionalCallExpression') &&
                                id.parent.callee === id) {
                                isFunctionCall = true;
                                break;
                            }
                        }
                    }
                    catch (e_12_1) { e_12 = { error: e_12_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_12) throw e_12.error; }
                    }
                    if (!isFunctionCall) {
                        return;
                    }
                    // If it's missing (i.e. in component scope) *and* it's a parameter
                    // then it is definitely coming from props destructuring.
                    // (It could also be props itself but we wouldn't be calling it then.)
                    missingCallbackDep_1 = missingDep;
                });
                if (missingCallbackDep_1 !== null) {
                    extraWarning =
                        " If '".concat(missingCallbackDep_1, "' changes too often, ") +
                            "find the parent component that defines it " +
                            "and wrap that definition in useCallback.";
                }
            }
            if (!extraWarning && missingDependencies.size > 0) {
                var setStateRecommendation = null;
                try {
                    for (var missingDependencies_1 = __values(missingDependencies), missingDependencies_1_1 = missingDependencies_1.next(); !missingDependencies_1_1.done; missingDependencies_1_1 = missingDependencies_1.next()) {
                        var missingDep = missingDependencies_1_1.value;
                        if (setStateRecommendation !== null) {
                            break;
                        }
                        var usedDep = dependencies.get(missingDep);
                        var references = usedDep.references;
                        var id = void 0;
                        var maybeCall = void 0;
                        try {
                            for (var references_1 = (e_3 = void 0, __values(references)), references_1_1 = references_1.next(); !references_1_1.done; references_1_1 = references_1.next()) {
                                var reference = references_1_1.value;
                                id = reference.identifier;
                                maybeCall = id.parent;
                                // Try to see if we have setState(someExpr(missingDep)).
                                while (maybeCall != null && maybeCall !== componentScope.block) {
                                    if (maybeCall.type === 'CallExpression') {
                                        var correspondingStateVariable = setStateCallSites.get(maybeCall.callee);
                                        if (correspondingStateVariable != null) {
                                            if ('name' in correspondingStateVariable &&
                                                correspondingStateVariable.name === missingDep) {
                                                // setCount(count + 1)
                                                setStateRecommendation = {
                                                    missingDep: missingDep,
                                                    setter: 'name' in maybeCall.callee ? maybeCall.callee.name : '',
                                                    form: 'updater',
                                                };
                                            }
                                            else if (stateVariables.has(id)) {
                                                // setCount(count + increment)
                                                setStateRecommendation = {
                                                    missingDep: missingDep,
                                                    setter: 'name' in maybeCall.callee ? maybeCall.callee.name : '',
                                                    form: 'reducer',
                                                };
                                            }
                                            else {
                                                var resolved = reference.resolved;
                                                if (resolved != null) {
                                                    // If it's a parameter *and* a missing dep,
                                                    // it must be a prop or something inside a prop.
                                                    // Therefore, recommend an inline reducer.
                                                    var def = resolved.defs[0];
                                                    if (def != null && def.type === 'Parameter') {
                                                        setStateRecommendation = {
                                                            missingDep: missingDep,
                                                            setter: 'name' in maybeCall.callee
                                                                ? maybeCall.callee.name
                                                                : '',
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
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (references_1_1 && !references_1_1.done && (_c = references_1.return)) _c.call(references_1);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (missingDependencies_1_1 && !missingDependencies_1_1.done && (_b = missingDependencies_1.return)) _b.call(missingDependencies_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                if (setStateRecommendation !== null) {
                    switch (setStateRecommendation.form) {
                        case 'reducer':
                            extraWarning =
                                " You can also replace multiple useState variables with useReducer " +
                                    "if '".concat(setStateRecommendation.setter, "' needs the ") +
                                    "current value of '".concat(setStateRecommendation.missingDep, "'.");
                            break;
                        case 'inlineReducer':
                            extraWarning =
                                " If '".concat(setStateRecommendation.setter, "' needs the ") +
                                    "current value of '".concat(setStateRecommendation.missingDep, "', ") +
                                    "you can also switch to useReducer instead of useState and " +
                                    "read '".concat(setStateRecommendation.missingDep, "' in the reducer.");
                            break;
                        case 'updater':
                            extraWarning =
                                " You can also do a functional update '".concat(setStateRecommendation.setter, "(").concat(setStateRecommendation.missingDep.slice(0, 1), " => ...)' if you only need '").concat(setStateRecommendation.missingDep, "'") + " in the '".concat(setStateRecommendation.setter, "' call.");
                            break;
                        default:
                            throw new Error('Unknown case.');
                    }
                }
            }
            reportProblem({
                node: declaredDependenciesNode,
                message: "React Hook ".concat(getSourceCode().getText(reactiveHook), " has ") +
                    // To avoid a long message, show the next actionable item.
                    (getWarningMessage(missingDependencies, 'a', 'missing', 'include') ||
                        getWarningMessage(unnecessaryDependencies, 'an', 'unnecessary', 'exclude') ||
                        getWarningMessage(duplicateDependencies, 'a', 'duplicate', 'omit')) +
                    extraWarning,
                suggest: [
                    {
                        desc: "Update the dependencies array to be: [".concat(suggestedDeps
                            .map(formatDependency)
                            .join(', '), "]"),
                        fix: function (fixer) {
                            // TODO: consider preserving the comments or formatting?
                            return fixer.replaceText(declaredDependenciesNode, "[".concat(suggestedDeps.map(formatDependency).join(', '), "]"));
                        },
                    },
                ],
            });
        }
        function visitCallExpression(node) {
            var callbackIndex = getReactiveHookCallbackIndex(node.callee, options);
            if (callbackIndex === -1) {
                // Not a React Hook call that needs deps.
                return;
            }
            var callback = node.arguments[callbackIndex];
            var reactiveHook = node.callee;
            var nodeWithoutNamespace = getNodeWithoutReactNamespace(reactiveHook);
            var reactiveHookName = 'name' in nodeWithoutNamespace ? nodeWithoutNamespace.name : '';
            var maybeNode = node.arguments[callbackIndex + 1];
            var declaredDependenciesNode = maybeNode &&
                !(maybeNode.type === 'Identifier' && maybeNode.name === 'undefined')
                ? maybeNode
                : undefined;
            var isEffect = /Effect($|[^a-z])/g.test(reactiveHookName);
            // Check whether a callback is supplied. If there is no callback supplied
            // then the hook will not work and React will throw a TypeError.
            // So no need to check for dependency inclusion.
            if (!callback) {
                reportProblem({
                    node: reactiveHook,
                    message: "React Hook ".concat(reactiveHookName, " requires an effect callback. ") +
                        "Did you forget to pass a callback to the hook?",
                });
                return;
            }
            // Check the declared dependencies for this reactive hook. If there is no
            // second argument then the reactive callback will re-run on every render.
            // So no need to check for dependency inclusion.
            if (!declaredDependenciesNode && !isEffect) {
                // These are only used for optimization.
                if (reactiveHookName === 'useMemo' ||
                    reactiveHookName === 'useCallback') {
                    // TODO: Can this have a suggestion?
                    reportProblem({
                        node: reactiveHook,
                        message: "React Hook ".concat(reactiveHookName, " does nothing when called with ") +
                            "only one argument. Did you forget to pass an array of " +
                            "dependencies?",
                    });
                }
                return;
            }
            while (callback.type === 'TSAsExpression' ||
                callback.type === 'AsExpression') {
                callback = callback.expression;
            }
            switch (callback.type) {
                case 'FunctionExpression':
                case 'ArrowFunctionExpression':
                    visitFunctionWithDependencies(callback, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect);
                    return; // Handled
                case 'Identifier':
                    if (!declaredDependenciesNode) {
                        // No deps, no problems.
                        return; // Handled
                    }
                    // The function passed as a callback is not written inline.
                    // But perhaps it's in the dependencies array?
                    if ('elements' in declaredDependenciesNode &&
                        declaredDependenciesNode.elements &&
                        declaredDependenciesNode.elements.some(function (el) { return el && el.type === 'Identifier' && el.name === callback.name; })) {
                        // If it's already in the list of deps, we don't care because
                        // this is valid regardless.
                        return; // Handled
                    }
                    // We'll do our best effort to find it, complain otherwise.
                    var variable = getScope(callback).set.get(callback.name);
                    if (variable == null || variable.defs == null) {
                        // If it's not in scope, we don't care.
                        return; // Handled
                    }
                    // The function passed as a callback is not written inline.
                    // But it's defined somewhere in the render scope.
                    // We'll do our best effort to find and check it, complain otherwise.
                    var def = variable.defs[0];
                    if (!def || !def.node) {
                        break; // Unhandled
                    }
                    if (def.type === 'Parameter') {
                        reportProblem({
                            node: reactiveHook,
                            message: getUnknownDependenciesMessage(reactiveHookName),
                        });
                        return;
                    }
                    if (def.type !== 'Variable' && def.type !== 'FunctionName') {
                        // Parameter or an unusual pattern. Bail out.
                        break; // Unhandled
                    }
                    switch (def.node.type) {
                        case 'FunctionDeclaration':
                            // useEffect(() => { ... }, []);
                            visitFunctionWithDependencies(def.node, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect);
                            return; // Handled
                        case 'VariableDeclarator':
                            var init = def.node.init;
                            if (!init) {
                                break; // Unhandled
                            }
                            switch (init.type) {
                                // const effectBody = () => {...};
                                // useEffect(effectBody, []);
                                case 'ArrowFunctionExpression':
                                case 'FunctionExpression':
                                    // We can inspect this function as if it were inline.
                                    visitFunctionWithDependencies(init, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect);
                                    return; // Handled
                            }
                            break; // Unhandled
                    }
                    break; // Unhandled
                default:
                    // useEffect(generateEffectBody(), []);
                    reportProblem({
                        node: reactiveHook,
                        message: getUnknownDependenciesMessage(reactiveHookName),
                    });
                    return; // Handled
            }
            // Something unusual. Fall back to suggesting to add the body itself as a dep.
            reportProblem({
                node: reactiveHook,
                message: "React Hook ".concat(reactiveHookName, " has a missing dependency: '").concat(callback.name, "'. ") +
                    "Either include it or remove the dependency array.",
                suggest: [
                    {
                        desc: "Update the dependencies array to be: [".concat(callback.name, "]"),
                        fix: function (fixer) {
                            return fixer.replaceText(declaredDependenciesNode, "[".concat(callback.name, "]"));
                        },
                    },
                ],
            });
        }
        return {
            CallExpression: visitCallExpression,
        };
    },
};
// The meat of the logic.
function collectRecommendations(_a) {
    var dependencies = _a.dependencies, declaredDependencies = _a.declaredDependencies, stableDependencies = _a.stableDependencies, externalDependencies = _a.externalDependencies, isEffect = _a.isEffect;
    // Our primary data structure.
    // It is a logical representation of property chains:
    // `props` -> `props.foo` -> `props.foo.bar` -> `props.foo.bar.baz`
    //         -> `props.lol`
    //         -> `props.huh` -> `props.huh.okay`
    //         -> `props.wow`
    // We'll use it to mark nodes that are *used* by the programmer,
    // and the nodes that were *declared* as deps. Then we will
    // traverse it to learn which deps are missing or unnecessary.
    var depTree = createDepTree();
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
    dependencies.forEach(function (_, key) {
        var node = getOrCreateNodeByPath(depTree, key);
        node.isUsed = true;
        markAllParentsByPath(depTree, key, function (parent) {
            parent.isSubtreeUsed = true;
        });
    });
    // Mark all satisfied nodes.
    // Imagine checkmarks next to each declared dependency.
    declaredDependencies.forEach(function (_a) {
        var key = _a.key;
        var node = getOrCreateNodeByPath(depTree, key);
        node.isSatisfiedRecursively = true;
    });
    stableDependencies.forEach(function (key) {
        var node = getOrCreateNodeByPath(depTree, key);
        node.isSatisfiedRecursively = true;
    });
    // Tree manipulation helpers.
    function getOrCreateNodeByPath(rootNode, path) {
        var e_13, _a;
        var keys = path.split('.');
        var node = rootNode;
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                var child = node.children.get(key);
                if (!child) {
                    child = createDepTree();
                    node.children.set(key, child);
                }
                node = child;
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_13) throw e_13.error; }
        }
        return node;
    }
    function markAllParentsByPath(rootNode, path, fn) {
        var e_14, _a;
        var keys = path.split('.');
        var node = rootNode;
        try {
            for (var keys_2 = __values(keys), keys_2_1 = keys_2.next(); !keys_2_1.done; keys_2_1 = keys_2.next()) {
                var key = keys_2_1.value;
                var child = node.children.get(key);
                if (!child) {
                    return;
                }
                fn(child);
                node = child;
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (keys_2_1 && !keys_2_1.done && (_a = keys_2.return)) _a.call(keys_2);
            }
            finally { if (e_14) throw e_14.error; }
        }
    }
    // Now we can learn which dependencies are missing or necessary.
    var missingDependencies = new Set();
    var satisfyingDependencies = new Set();
    scanTreeRecursively(depTree, missingDependencies, satisfyingDependencies, function (key) { return key; });
    function scanTreeRecursively(node, missingPaths, satisfyingPaths, keyToPath) {
        node.children.forEach(function (child, key) {
            var path = keyToPath(key);
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
            scanTreeRecursively(child, missingPaths, satisfyingPaths, function (childKey) { return path + '.' + childKey; });
        });
    }
    // Collect suggestions in the order they were originally specified.
    var suggestedDependencies = [];
    var unnecessaryDependencies = new Set();
    var duplicateDependencies = new Set();
    declaredDependencies.forEach(function (_a) {
        var key = _a.key;
        // Does this declared dep satisfy a real need?
        if (satisfyingDependencies.has(key)) {
            if (suggestedDependencies.indexOf(key) === -1) {
                // Good one.
                suggestedDependencies.push(key);
            }
            else {
                // Duplicate.
                duplicateDependencies.add(key);
            }
        }
        else {
            if (isEffect &&
                !key.endsWith('.current') &&
                !externalDependencies.has(key)) {
                // Effects are allowed extra "unnecessary" deps.
                // Such as resetting scroll when ID changes.
                // Consider them legit.
                // The exception is ref.current which is always wrong.
                if (suggestedDependencies.indexOf(key) === -1) {
                    suggestedDependencies.push(key);
                }
            }
            else {
                // It's definitely not needed.
                unnecessaryDependencies.add(key);
            }
        }
    });
    // Then add the missing ones at the end.
    missingDependencies.forEach(function (key) {
        suggestedDependencies.push(key);
    });
    return {
        suggestedDependencies: suggestedDependencies,
        unnecessaryDependencies: unnecessaryDependencies,
        duplicateDependencies: duplicateDependencies,
        missingDependencies: missingDependencies,
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
            if (getConstructionExpressionType(node.consequent) != null ||
                getConstructionExpressionType(node.alternate) != null) {
                return 'conditional';
            }
            return null;
        case 'LogicalExpression':
            if (getConstructionExpressionType(node.left) != null ||
                getConstructionExpressionType(node.right) != null) {
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
function scanForConstructions(_a) {
    var declaredDependencies = _a.declaredDependencies, declaredDependenciesNode = _a.declaredDependenciesNode, componentScope = _a.componentScope, scope = _a.scope;
    var constructions = declaredDependencies
        .map(function (_a) {
        var key = _a.key;
        var ref = componentScope.variables.find(function (v) { return v.name === key; });
        if (ref == null) {
            return null;
        }
        var node = ref.defs[0];
        if (node == null) {
            return null;
        }
        // const handleChange = function () {}
        // const handleChange = () => {}
        // const foo = {}
        // const foo = []
        // etc.
        if (node.type === 'Variable' &&
            node.node.type === 'VariableDeclarator' &&
            node.node.id.type === 'Identifier' && // Ensure this is not destructed assignment
            node.node.init != null) {
            var constantExpressionType = getConstructionExpressionType(node.node.init);
            if (constantExpressionType) {
                return [ref, constantExpressionType];
            }
        }
        // function handleChange() {}
        if (node.type === 'FunctionName' &&
            node.node.type === 'FunctionDeclaration') {
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
        var e_15, _a;
        var foundWriteExpr = false;
        try {
            for (var _b = __values(ref.references), _c = _b.next(); !_c.done; _c = _b.next()) {
                var reference = _c.value;
                if (reference.writeExpr) {
                    if (foundWriteExpr) {
                        // Two writes to the same function.
                        return true;
                    }
                    else {
                        // Ignore first write as it's not usage.
                        foundWriteExpr = true;
                        continue;
                    }
                }
                var currentScope = reference.from;
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
        }
        catch (e_15_1) { e_15 = { error: e_15_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_15) throw e_15.error; }
        }
        return false;
    }
    return constructions.map(function (_a) {
        var _b = __read(_a, 2), ref = _b[0], depType = _b[1];
        return ({
            construction: ref.defs[0],
            depType: depType,
            isUsedOutsideOfHook: isUsedOutsideOfHook(ref),
        });
    });
}
/**
 * Assuming () means the passed/returned node:
 * (props) => (props)
 * props.(foo) => (props.foo)
 * props.foo.(bar) => (props).foo.bar
 * props.foo.bar.(baz) => (props).foo.bar.baz
 */
function getDependency(node) {
    if (node.parent &&
        (node.parent.type === 'MemberExpression' ||
            node.parent.type === 'OptionalMemberExpression') &&
        node.parent.object === node &&
        'name' in node.parent.property &&
        node.parent.property.name !== 'current' &&
        !node.parent.computed &&
        !(node.parent.parent != null &&
            (node.parent.parent.type === 'CallExpression' ||
                node.parent.parent.type === 'OptionalCallExpression') &&
            node.parent.parent.callee === node.parent)) {
        return getDependency(node.parent);
    }
    else if (
    // Note: we don't check OptionalMemberExpression because it can't be LHS.
    node.type === 'MemberExpression' &&
        node.parent &&
        node.parent.type === 'AssignmentExpression' &&
        node.parent.left === node) {
        return node.object;
    }
    else {
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
        if ('optional' in node && node.optional) {
            // We only want to consider it optional if *all* usages were optional.
            if (!optionalChains.has(result)) {
                // Mark as (maybe) optional. If there's a required usage, this will be overridden.
                optionalChains.set(result, true);
            }
        }
        else {
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
        var result = node.name;
        if (optionalChains) {
            // Mark as required.
            optionalChains.set(result, false);
        }
        return result;
    }
    else if (node.type === 'MemberExpression' && !node.computed) {
        var object = analyzePropertyChain(node.object, optionalChains);
        var property = analyzePropertyChain(node.property, null);
        var result = "".concat(object, ".").concat(property);
        markNode(node, optionalChains, result);
        return result;
    }
    else if (node.type === 'OptionalMemberExpression' && !node.computed) {
        var object = analyzePropertyChain(node.object, optionalChains);
        var property = analyzePropertyChain(node.property, null);
        var result = "".concat(object, ".").concat(property);
        markNode(node, optionalChains, result);
        return result;
    }
    else if (node.type === 'ChainExpression' &&
        (!('computed' in node) || !node.computed)) {
        var expression = node.expression;
        if (expression.type === 'CallExpression') {
            throw new Error("Unsupported node type: ".concat(expression.type));
        }
        var object = analyzePropertyChain(expression.object, optionalChains);
        var property = analyzePropertyChain(expression.property, null);
        var result = "".concat(object, ".").concat(property);
        markNode(expression, optionalChains, result);
        return result;
    }
    else {
        throw new Error("Unsupported node type: ".concat(node.type));
    }
}
function getNodeWithoutReactNamespace(node) {
    if (node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'React' &&
        node.property.type === 'Identifier' &&
        !node.computed) {
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
    var node = getNodeWithoutReactNamespace(calleeNode);
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
                var name = void 0;
                try {
                    name = analyzePropertyChain(node, null);
                }
                catch (error) {
                    if (error instanceof Error &&
                        /Unsupported node type/.test(error.message)) {
                        return 0;
                    }
                    else {
                        throw error;
                    }
                }
                return options.additionalHooks.test(name) ? 0 : -1;
            }
            else {
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
    var e_16, _a;
    var queue = [start];
    var item;
    while (queue.length) {
        item = queue.shift();
        if (isSameIdentifier(item, target)) {
            return item;
        }
        if (!isAncestorNodeOf(item, target)) {
            continue;
        }
        try {
            for (var _b = (e_16 = void 0, __values(Object.entries(item))), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (key === 'parent') {
                    continue;
                }
                if (isNodeLike(value)) {
                    value.parent = item;
                    queue.push(value);
                }
                else if (Array.isArray(value)) {
                    value.forEach(function (val) {
                        if (isNodeLike(val)) {
                            val.parent = item;
                            queue.push(val);
                        }
                    });
                }
            }
        }
        catch (e_16_1) { e_16 = { error: e_16_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_16) throw e_16.error; }
        }
    }
    return null;
}
function joinEnglish(arr) {
    var s = '';
    for (var i = 0; i < arr.length; i++) {
        s += arr[i];
        if (i === 0 && arr.length === 2) {
            s += ' and ';
        }
        else if (i === arr.length - 2 && arr.length > 2) {
            s += ', and ';
        }
        else if (i < arr.length - 1) {
            s += ', ';
        }
    }
    return s;
}
function isNodeLike(val) {
    return (typeof val === 'object' &&
        val !== null &&
        !Array.isArray(val) &&
        'type' in val &&
        typeof val.type === 'string');
}
function isSameIdentifier(a, b) {
    return ((a.type === 'Identifier' || a.type === 'JSXIdentifier') &&
        a.type === b.type &&
        a.name === b.name &&
        !!a.range &&
        !!b.range &&
        a.range[0] === b.range[0] &&
        a.range[1] === b.range[1]);
}
function isAncestorNodeOf(a, b) {
    return (!!a.range &&
        !!b.range &&
        a.range[0] <= b.range[0] &&
        a.range[1] >= b.range[1]);
}
function isUseEffectEventIdentifier(node) {
    {
        return node.type === 'Identifier' && node.name === 'useEffectEvent';
    }
}
function getUnknownDependenciesMessage(reactiveHookName) {
    return ("React Hook ".concat(reactiveHookName, " received a function whose dependencies ") +
        "are unknown. Pass an inline function instead.");
}

// All rules
var rules = {
    'rules-of-hooks': rule$1,
    'exhaustive-deps': rule,
};
// Config rules
var configRules = {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
};
// Legacy config
var legacyRecommendedConfig = {
    plugins: ['react-hooks'],
    rules: configRules,
};
// Plugin object
var plugin = {
    // TODO: Make this more dynamic to populate version from package.json.
    // This can be done by injecting at build time, since importing the package.json isn't an option in Meta
    meta: { name: 'eslint-plugin-react-hooks' },
    rules: rules,
    configs: {
        /** Legacy recommended config, to be used with rc-based configurations */
        'recommended-legacy': legacyRecommendedConfig,
        /**
         * 'recommended' is currently aliased to the legacy / rc recommended config) to maintain backwards compatibility.
         * This is deprecated and in v6, it will switch to alias the flat recommended config.
         */
        recommended: legacyRecommendedConfig,
        /** Latest recommended config, to be used with flat configurations */
        'recommended-latest': {
            name: 'react-hooks/recommended',
            plugins: {
                get 'react-hooks'() {
                    return plugin;
                },
            },
            rules: configRules,
        },
    },
};
var configs = plugin.configs;
var meta = plugin.meta;
// TODO: If the plugin is ever updated to be pure ESM and drops support for rc-based configs, then it should be exporting the plugin as default
// instead of individual named exports.
// export default plugin;

exports.configs = configs;
exports.meta = meta;
exports.rules = rules;
  })();
}
