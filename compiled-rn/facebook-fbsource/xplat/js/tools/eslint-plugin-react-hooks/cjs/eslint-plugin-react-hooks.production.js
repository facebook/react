/**
 * @license React
 * eslint-plugin-react-hooks.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @generated SignedSource<<82e777cf50c9ff0001f4d618d4d0a52a>>
 */

'use strict';

const SETTINGS_KEY = 'react-hooks';
const SETTINGS_ADDITIONAL_EFFECT_HOOKS_KEY = 'additionalEffectHooks';
function getAdditionalEffectHooksFromSettings(settings) {
    var _a;
    const additionalHooks = (_a = settings[SETTINGS_KEY]) === null || _a === void 0 ? void 0 : _a[SETTINGS_ADDITIONAL_EFFECT_HOOKS_KEY];
    if (additionalHooks != null && typeof additionalHooks === 'string') {
        return new RegExp(additionalHooks);
    }
    return undefined;
}

const rule$1 = {
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
                    experimental_autoDependenciesHooks: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                    requireExplicitEffectDeps: {
                        type: 'boolean',
                    },
                },
            },
        ],
    },
    create(context) {
        const rawOptions = context.options && context.options[0];
        const settings = context.settings || {};
        const additionalHooks = rawOptions && rawOptions.additionalHooks
            ? new RegExp(rawOptions.additionalHooks)
            : getAdditionalEffectHooksFromSettings(settings);
        const enableDangerousAutofixThisMayCauseInfiniteLoops = (rawOptions &&
            rawOptions.enableDangerousAutofixThisMayCauseInfiniteLoops) ||
            false;
        const experimental_autoDependenciesHooks = rawOptions && Array.isArray(rawOptions.experimental_autoDependenciesHooks)
            ? rawOptions.experimental_autoDependenciesHooks
            : [];
        const requireExplicitEffectDeps = (rawOptions && rawOptions.requireExplicitEffectDeps) || false;
        const options = {
            additionalHooks,
            experimental_autoDependenciesHooks,
            enableDangerousAutofixThisMayCauseInfiniteLoops,
            requireExplicitEffectDeps,
        };
        function reportProblem(problem) {
            if (enableDangerousAutofixThisMayCauseInfiniteLoops) {
                if (Array.isArray(problem.suggest) &&
                    problem.suggest.length > 0 &&
                    problem.suggest[0]) {
                    problem.fix = problem.suggest[0].fix;
                }
            }
            context.report(problem);
        }
        const getSourceCode = typeof context.getSourceCode === 'function'
            ? () => {
                return context.getSourceCode();
            }
            : () => {
                return context.sourceCode;
            };
        const getScope = typeof context.getScope === 'function'
            ? () => {
                return context.getScope();
            }
            : (node) => {
                return context.sourceCode.getScope(node);
            };
        const scopeManager = getSourceCode().scopeManager;
        const setStateCallSites = new WeakMap();
        const stateVariables = new WeakSet();
        const stableKnownValueCache = new WeakMap();
        const functionWithoutCapturedValueCache = new WeakMap();
        const useEffectEventVariables = new WeakSet();
        function memoizeWithWeakMap(fn, map) {
            return function (arg) {
                if (map.has(arg)) {
                    return map.get(arg);
                }
                const result = fn(arg);
                map.set(arg, result);
                return result;
            };
        }
        function visitFunctionWithDependencies(node, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect, isAutoDepsHook) {
            if (isEffect && node.async) {
                reportProblem({
                    node: node,
                    message: `Effect callbacks are synchronous to prevent race conditions. ` +
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
            const scope = scopeManager.acquire(node);
            if (!scope) {
                throw new Error('Unable to acquire scope for the current node. This is a bug in eslint-plugin-react-hooks, please file an issue.');
            }
            const pureScopes = new Set();
            let componentScope = null;
            {
                let currentScope = scope.upper;
                while (currentScope) {
                    pureScopes.add(currentScope);
                    if (currentScope.type === 'function' ||
                        currentScope.type === 'hook' ||
                        currentScope.type === 'component') {
                        break;
                    }
                    currentScope = currentScope.upper;
                }
                if (!currentScope) {
                    return;
                }
                componentScope = currentScope;
            }
            const isArray = Array.isArray;
            function isStableKnownHookValue(resolved) {
                if (!isArray(resolved.defs)) {
                    return false;
                }
                const def = resolved.defs[0];
                if (def == null) {
                    return false;
                }
                const defNode = def.node;
                if (defNode.type !== 'VariableDeclarator') {
                    return false;
                }
                let init = defNode.init;
                if (init == null) {
                    return false;
                }
                while (init.type === 'TSAsExpression' || init.type === 'AsExpression') {
                    init = init.expression;
                }
                let declaration = defNode.parent;
                if (declaration == null && componentScope != null) {
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
                    return true;
                }
                if (init.type !== 'CallExpression') {
                    return false;
                }
                let callee = init.callee;
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
                const definitionNode = def.node;
                const id = definitionNode.id;
                const { name } = callee;
                if (name === 'useRef' && id.type === 'Identifier') {
                    return true;
                }
                else if (isUseEffectEventIdentifier$1(callee) &&
                    id.type === 'Identifier') {
                    for (const ref of resolved.references) {
                        if (ref !== id) {
                            useEffectEventVariables.add(ref.identifier);
                        }
                    }
                    return true;
                }
                else if (name === 'useState' ||
                    name === 'useReducer' ||
                    name === 'useActionState') {
                    if (id.type === 'ArrayPattern' &&
                        id.elements.length === 2 &&
                        isArray(resolved.identifiers)) {
                        if (id.elements[1] === resolved.identifiers[0]) {
                            if (name === 'useState') {
                                const references = resolved.references;
                                let writeCount = 0;
                                for (const reference of references) {
                                    if (reference.isWrite()) {
                                        writeCount++;
                                    }
                                    if (writeCount > 1) {
                                        return false;
                                    }
                                    setStateCallSites.set(reference.identifier, id.elements[0]);
                                }
                            }
                            return true;
                        }
                        else if (id.elements[0] === resolved.identifiers[0]) {
                            if (name === 'useState') {
                                const references = resolved.references;
                                for (const reference of references) {
                                    stateVariables.add(reference.identifier);
                                }
                            }
                            return false;
                        }
                    }
                }
                else if (name === 'useTransition') {
                    if (id.type === 'ArrayPattern' &&
                        id.elements.length === 2 &&
                        Array.isArray(resolved.identifiers)) {
                        if (id.elements[1] === resolved.identifiers[0]) {
                            return true;
                        }
                    }
                }
                return false;
            }
            function isFunctionWithoutCapturedValues(resolved) {
                if (!isArray(resolved.defs)) {
                    return false;
                }
                const def = resolved.defs[0];
                if (def == null) {
                    return false;
                }
                if (def.node == null || def.node.id == null) {
                    return false;
                }
                const fnNode = def.node;
                const childScopes = (componentScope === null || componentScope === void 0 ? void 0 : componentScope.childScopes) || [];
                let fnScope = null;
                for (const childScope of childScopes) {
                    const childScopeBlock = childScope.block;
                    if ((fnNode.type === 'FunctionDeclaration' &&
                        childScopeBlock === fnNode) ||
                        (fnNode.type === 'VariableDeclarator' &&
                            childScopeBlock.parent === fnNode)) {
                        fnScope = childScope;
                        break;
                    }
                }
                if (fnScope == null) {
                    return false;
                }
                for (const ref of fnScope.through) {
                    if (ref.resolved == null) {
                        continue;
                    }
                    if (pureScopes.has(ref.resolved.scope) &&
                        !memoizedIsStableKnownHookValue(ref.resolved)) {
                        return false;
                    }
                }
                return true;
            }
            const memoizedIsStableKnownHookValue = memoizeWithWeakMap(isStableKnownHookValue, stableKnownValueCache);
            const memoizedIsFunctionWithoutCapturedValues = memoizeWithWeakMap(isFunctionWithoutCapturedValues, functionWithoutCapturedValueCache);
            const currentRefsInEffectCleanup = new Map();
            function isInsideEffectCleanup(reference) {
                let curScope = reference.from;
                let isInReturnedFunction = false;
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
            const dependencies = new Map();
            const optionalChains = new Map();
            gatherDependenciesRecursively(scope);
            function gatherDependenciesRecursively(currentScope) {
                var _a, _b, _c, _d, _e;
                for (const reference of currentScope.references) {
                    if (!reference.resolved) {
                        continue;
                    }
                    if (!pureScopes.has(reference.resolved.scope)) {
                        continue;
                    }
                    const referenceNode = fastFindReferenceWithParent(node, reference.identifier);
                    if (referenceNode == null) {
                        continue;
                    }
                    const dependencyNode = getDependency(referenceNode);
                    const dependency = analyzePropertyChain(dependencyNode, optionalChains);
                    if (isEffect &&
                        dependencyNode.type === 'Identifier' &&
                        (((_a = dependencyNode.parent) === null || _a === void 0 ? void 0 : _a.type) === 'MemberExpression' ||
                            ((_b = dependencyNode.parent) === null || _b === void 0 ? void 0 : _b.type) === 'OptionalMemberExpression') &&
                        !dependencyNode.parent.computed &&
                        dependencyNode.parent.property.type === 'Identifier' &&
                        dependencyNode.parent.property.name === 'current' &&
                        isInsideEffectCleanup(reference)) {
                        currentRefsInEffectCleanup.set(dependency, {
                            reference,
                            dependencyNode,
                        });
                    }
                    if (((_c = dependencyNode.parent) === null || _c === void 0 ? void 0 : _c.type) === 'TSTypeQuery' ||
                        ((_d = dependencyNode.parent) === null || _d === void 0 ? void 0 : _d.type) === 'TSTypeReference') {
                        continue;
                    }
                    const def = reference.resolved.defs[0];
                    if (def == null) {
                        continue;
                    }
                    if (def.node != null && def.node.init === node.parent) {
                        continue;
                    }
                    if (def.type === 'TypeParameter') {
                        continue;
                    }
                    if (!dependencies.has(dependency)) {
                        const resolved = reference.resolved;
                        const isStable = memoizedIsStableKnownHookValue(resolved) ||
                            memoizedIsFunctionWithoutCapturedValues(resolved);
                        dependencies.set(dependency, {
                            isStable,
                            references: [reference],
                        });
                    }
                    else {
                        (_e = dependencies.get(dependency)) === null || _e === void 0 ? void 0 : _e.references.push(reference);
                    }
                }
                for (const childScope of currentScope.childScopes) {
                    gatherDependenciesRecursively(childScope);
                }
            }
            currentRefsInEffectCleanup.forEach(({ reference, dependencyNode }, dependency) => {
                var _a, _b;
                const references = ((_a = reference.resolved) === null || _a === void 0 ? void 0 : _a.references) || [];
                let foundCurrentAssignment = false;
                for (const ref of references) {
                    const { identifier } = ref;
                    const { parent } = identifier;
                    if (parent != null &&
                        parent.type === 'MemberExpression' &&
                        !parent.computed &&
                        parent.property.type === 'Identifier' &&
                        parent.property.name === 'current' &&
                        ((_b = parent.parent) === null || _b === void 0 ? void 0 : _b.type) === 'AssignmentExpression' &&
                        parent.parent.left === parent) {
                        foundCurrentAssignment = true;
                        break;
                    }
                }
                if (foundCurrentAssignment) {
                    return;
                }
                reportProblem({
                    node: dependencyNode.parent.property,
                    message: `The ref value '${dependency}.current' will likely have ` +
                        `changed by the time this effect cleanup function runs. If ` +
                        `this ref points to a node rendered by React, copy ` +
                        `'${dependency}.current' to a variable inside the effect, and ` +
                        `use that variable in the cleanup function.`,
                });
            });
            const staleAssignments = new Set();
            function reportStaleAssignment(writeExpr, key) {
                if (staleAssignments.has(key)) {
                    return;
                }
                staleAssignments.add(key);
                reportProblem({
                    node: writeExpr,
                    message: `Assignments to the '${key}' variable from inside React Hook ` +
                        `${getSourceCode().getText(reactiveHook)} will be lost after each ` +
                        `render. To preserve the value over time, store it in a useRef ` +
                        `Hook and keep the mutable value in the '.current' property. ` +
                        `Otherwise, you can move this variable directly inside ` +
                        `${getSourceCode().getText(reactiveHook)}.`,
                });
            }
            const stableDependencies = new Set();
            dependencies.forEach(({ isStable, references }, key) => {
                if (isStable) {
                    stableDependencies.add(key);
                }
                references.forEach(reference => {
                    if (reference.writeExpr) {
                        reportStaleAssignment(reference.writeExpr, key);
                    }
                });
            });
            if (staleAssignments.size > 0) {
                return;
            }
            if (!declaredDependenciesNode) {
                if (isAutoDepsHook) {
                    return;
                }
                let setStateInsideEffectWithoutDeps = null;
                dependencies.forEach(({ references }, key) => {
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
                        while (fnScope != null && fnScope.type !== 'function') {
                            fnScope = fnScope.upper;
                        }
                        const isDirectlyInsideEffect = (fnScope === null || fnScope === void 0 ? void 0 : fnScope.block) === node;
                        if (isDirectlyInsideEffect) {
                            setStateInsideEffectWithoutDeps = key;
                        }
                    });
                });
                if (setStateInsideEffectWithoutDeps) {
                    const { suggestedDependencies } = collectRecommendations({
                        dependencies,
                        declaredDependencies: [],
                        stableDependencies,
                        externalDependencies: new Set(),
                        isEffect: true,
                    });
                    reportProblem({
                        node: reactiveHook,
                        message: `React Hook ${reactiveHookName} contains a call to '${setStateInsideEffectWithoutDeps}'. ` +
                            `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
                            `To fix this, pass [` +
                            suggestedDependencies.join(', ') +
                            `] as a second argument to the ${reactiveHookName} Hook.`,
                        suggest: [
                            {
                                desc: `Add dependencies array: [${suggestedDependencies.join(', ')}]`,
                                fix(fixer) {
                                    return fixer.insertTextAfter(node, `, [${suggestedDependencies.join(', ')}]`);
                                },
                            },
                        ],
                    });
                }
                return;
            }
            if (isAutoDepsHook &&
                declaredDependenciesNode.type === 'Literal' &&
                declaredDependenciesNode.value === null) {
                return;
            }
            const declaredDependencies = [];
            const externalDependencies = new Set();
            const isArrayExpression = declaredDependenciesNode.type === 'ArrayExpression';
            const isTSAsArrayExpression = declaredDependenciesNode.type === 'TSAsExpression' &&
                declaredDependenciesNode.expression.type === 'ArrayExpression';
            if (!isArrayExpression && !isTSAsArrayExpression) {
                reportProblem({
                    node: declaredDependenciesNode,
                    message: `React Hook ${getSourceCode().getText(reactiveHook)} was passed a ` +
                        'dependency list that is not an array literal. This means we ' +
                        "can't statically verify whether you've passed the correct " +
                        'dependencies.',
                });
            }
            else {
                const arrayExpression = isTSAsArrayExpression
                    ? declaredDependenciesNode.expression
                    : declaredDependenciesNode;
                arrayExpression.elements.forEach(declaredDependencyNode => {
                    if (declaredDependencyNode === null) {
                        return;
                    }
                    if (declaredDependencyNode.type === 'SpreadElement') {
                        reportProblem({
                            node: declaredDependencyNode,
                            message: `React Hook ${getSourceCode().getText(reactiveHook)} has a spread ` +
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
                                `Remove \`${getSourceCode().getText(declaredDependencyNode)}\` from the list.`,
                            suggest: [
                                {
                                    desc: `Remove the dependency \`${getSourceCode().getText(declaredDependencyNode)}\``,
                                    fix(fixer) {
                                        return fixer.removeRange(declaredDependencyNode.range);
                                    },
                                },
                            ],
                        });
                    }
                    let declaredDependency;
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
                                        message: `The ${declaredDependencyNode.raw} literal is not a valid dependency ` +
                                            `because it never changes. ` +
                                            `Did you mean to include ${declaredDependencyNode.value} in the array instead?`,
                                    });
                                }
                                else {
                                    reportProblem({
                                        node: declaredDependencyNode,
                                        message: `The ${declaredDependencyNode.raw} literal is not a valid dependency ` +
                                            'because it never changes. You can safely remove it.',
                                    });
                                }
                            }
                            else {
                                reportProblem({
                                    node: declaredDependencyNode,
                                    message: `React Hook ${getSourceCode().getText(reactiveHook)} has a ` +
                                        `complex expression in the dependency array. ` +
                                        'Extract it to a separate variable so it can be statically checked.',
                                });
                            }
                            return;
                        }
                        else {
                            throw error;
                        }
                    }
                    let maybeID = declaredDependencyNode;
                    while (maybeID.type === 'MemberExpression' ||
                        maybeID.type === 'OptionalMemberExpression' ||
                        maybeID.type === 'ChainExpression') {
                        maybeID = maybeID.object || maybeID.expression.object;
                    }
                    const isDeclaredInComponent = !componentScope.through.some(ref => ref.identifier === maybeID);
                    declaredDependencies.push({
                        key: declaredDependency,
                        node: declaredDependencyNode,
                    });
                    if (!isDeclaredInComponent) {
                        externalDependencies.add(declaredDependency);
                    }
                });
            }
            const { suggestedDependencies, unnecessaryDependencies, missingDependencies, duplicateDependencies, } = collectRecommendations({
                dependencies,
                declaredDependencies,
                stableDependencies,
                externalDependencies,
                isEffect,
            });
            let suggestedDeps = suggestedDependencies;
            const problemCount = duplicateDependencies.size +
                missingDependencies.size +
                unnecessaryDependencies.size;
            if (problemCount === 0) {
                const constructions = scanForConstructions({
                    declaredDependencies,
                    declaredDependenciesNode,
                    componentScope,
                    scope,
                });
                constructions.forEach(({ construction, isUsedOutsideOfHook, depType }) => {
                    var _a;
                    const wrapperHook = depType === 'function' ? 'useCallback' : 'useMemo';
                    const constructionType = depType === 'function' ? 'definition' : 'initialization';
                    const defaultAdvice = `wrap the ${constructionType} of '${construction.name.name}' in its own ${wrapperHook}() Hook.`;
                    const advice = isUsedOutsideOfHook
                        ? `To fix this, ${defaultAdvice}`
                        : `Move it inside the ${reactiveHookName} callback. Alternatively, ${defaultAdvice}`;
                    const causation = depType === 'conditional' || depType === 'logical expression'
                        ? 'could make'
                        : 'makes';
                    const message = `The '${construction.name.name}' ${depType} ${causation} the dependencies of ` +
                        `${reactiveHookName} Hook (at line ${(_a = declaredDependenciesNode.loc) === null || _a === void 0 ? void 0 : _a.start.line}) ` +
                        `change on every render. ${advice}`;
                    let suggest;
                    if (isUsedOutsideOfHook &&
                        construction.type === 'Variable' &&
                        depType === 'function') {
                        suggest = [
                            {
                                desc: `Wrap the ${constructionType} of '${construction.name.name}' in its own ${wrapperHook}() Hook.`,
                                fix(fixer) {
                                    const [before, after] = wrapperHook === 'useMemo'
                                        ? [`useMemo(() => { return `, '; })']
                                        : ['useCallback(', ')'];
                                    return [
                                        fixer.insertTextBefore(construction.node.init, before),
                                        fixer.insertTextAfter(construction.node.init, after),
                                    ];
                                },
                            },
                        ];
                    }
                    reportProblem({
                        node: construction.node,
                        message,
                        suggest,
                    });
                });
                return;
            }
            if (!isEffect && missingDependencies.size > 0) {
                suggestedDeps = collectRecommendations({
                    dependencies,
                    declaredDependencies: [],
                    stableDependencies,
                    externalDependencies,
                    isEffect,
                }).suggestedDependencies;
            }
            function areDeclaredDepsAlphabetized() {
                if (declaredDependencies.length === 0) {
                    return true;
                }
                const declaredDepKeys = declaredDependencies.map(dep => dep.key);
                const sortedDeclaredDepKeys = declaredDepKeys.slice().sort();
                return declaredDepKeys.join(',') === sortedDeclaredDepKeys.join(',');
            }
            if (areDeclaredDepsAlphabetized()) {
                suggestedDeps.sort();
            }
            function formatDependency(path) {
                const members = path.split('.');
                let finalPath = '';
                for (let i = 0; i < members.length; i++) {
                    if (i !== 0) {
                        const pathSoFar = members.slice(0, i + 1).join('.');
                        const isOptional = optionalChains.get(pathSoFar) === true;
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
                        .map(name => "'" + formatDependency(name) + "'")) +
                    `. Either ${fixVerb} ${deps.size > 1 ? 'them' : 'it'} or remove the dependency array.`);
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
                }
                else if (externalDependencies.size > 0) {
                    const dep = Array.from(externalDependencies)[0];
                    if (!scope.set.has(dep)) {
                        extraWarning =
                            ` Outer scope values like '${dep}' aren't valid dependencies ` +
                                `because mutating them doesn't re-render the component.`;
                    }
                }
            }
            if (!extraWarning && missingDependencies.has('props')) {
                const propDep = dependencies.get('props');
                if (propDep == null) {
                    return;
                }
                const refs = propDep.references;
                if (!Array.isArray(refs)) {
                    return;
                }
                let isPropsOnlyUsedInMembers = true;
                for (const ref of refs) {
                    const id = fastFindReferenceWithParent(componentScope.block, ref.identifier);
                    if (!id) {
                        isPropsOnlyUsedInMembers = false;
                        break;
                    }
                    const parent = id.parent;
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
                if (isPropsOnlyUsedInMembers) {
                    extraWarning =
                        ` However, 'props' will change when *any* prop changes, so the ` +
                            `preferred fix is to destructure the 'props' object outside of ` +
                            `the ${reactiveHookName} call and refer to those specific props ` +
                            `inside ${getSourceCode().getText(reactiveHook)}.`;
                }
            }
            if (!extraWarning && missingDependencies.size > 0) {
                let missingCallbackDep = null;
                missingDependencies.forEach(missingDep => {
                    var _a;
                    if (missingCallbackDep) {
                        return;
                    }
                    const topScopeRef = componentScope.set.get(missingDep);
                    const usedDep = dependencies.get(missingDep);
                    if (!(usedDep === null || usedDep === void 0 ? void 0 : usedDep.references) ||
                        ((_a = usedDep === null || usedDep === void 0 ? void 0 : usedDep.references[0]) === null || _a === void 0 ? void 0 : _a.resolved) !== topScopeRef) {
                        return;
                    }
                    const def = topScopeRef === null || topScopeRef === void 0 ? void 0 : topScopeRef.defs[0];
                    if (def == null || def.name == null || def.type !== 'Parameter') {
                        return;
                    }
                    let isFunctionCall = false;
                    let id;
                    for (const reference of usedDep.references) {
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
                    if (!isFunctionCall) {
                        return;
                    }
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
                for (const missingDep of missingDependencies) {
                    if (setStateRecommendation !== null) {
                        break;
                    }
                    const usedDep = dependencies.get(missingDep);
                    const references = usedDep.references;
                    let id;
                    let maybeCall;
                    for (const reference of references) {
                        id = reference.identifier;
                        maybeCall = id.parent;
                        while (maybeCall != null && maybeCall !== componentScope.block) {
                            if (maybeCall.type === 'CallExpression') {
                                const correspondingStateVariable = setStateCallSites.get(maybeCall.callee);
                                if (correspondingStateVariable != null) {
                                    if ('name' in correspondingStateVariable &&
                                        correspondingStateVariable.name === missingDep) {
                                        setStateRecommendation = {
                                            missingDep,
                                            setter: 'name' in maybeCall.callee ? maybeCall.callee.name : '',
                                            form: 'updater',
                                        };
                                    }
                                    else if (stateVariables.has(id)) {
                                        setStateRecommendation = {
                                            missingDep,
                                            setter: 'name' in maybeCall.callee ? maybeCall.callee.name : '',
                                            form: 'reducer',
                                        };
                                    }
                                    else {
                                        const resolved = reference.resolved;
                                        if (resolved != null) {
                                            const def = resolved.defs[0];
                                            if (def != null && def.type === 'Parameter') {
                                                setStateRecommendation = {
                                                    missingDep,
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
                                ` You can also do a functional update '${setStateRecommendation.setter}(${setStateRecommendation.missingDep.slice(0, 1)} => ...)' if you only need '${setStateRecommendation.missingDep}'` + ` in the '${setStateRecommendation.setter}' call.`;
                            break;
                        default:
                            throw new Error('Unknown case.');
                    }
                }
            }
            reportProblem({
                node: declaredDependenciesNode,
                message: `React Hook ${getSourceCode().getText(reactiveHook)} has ` +
                    (getWarningMessage(missingDependencies, 'a', 'missing', 'include') ||
                        getWarningMessage(unnecessaryDependencies, 'an', 'unnecessary', 'exclude') ||
                        getWarningMessage(duplicateDependencies, 'a', 'duplicate', 'omit')) +
                    extraWarning,
                suggest: [
                    {
                        desc: `Update the dependencies array to be: [${suggestedDeps
                            .map(formatDependency)
                            .join(', ')}]`,
                        fix(fixer) {
                            return fixer.replaceText(declaredDependenciesNode, `[${suggestedDeps.map(formatDependency).join(', ')}]`);
                        },
                    },
                ],
            });
        }
        function visitCallExpression(node) {
            const callbackIndex = getReactiveHookCallbackIndex(node.callee, options);
            if (callbackIndex === -1) {
                return;
            }
            let callback = node.arguments[callbackIndex];
            const reactiveHook = node.callee;
            const nodeWithoutNamespace = getNodeWithoutReactNamespace$1(reactiveHook);
            const reactiveHookName = 'name' in nodeWithoutNamespace ? nodeWithoutNamespace.name : '';
            const maybeNode = node.arguments[callbackIndex + 1];
            const declaredDependenciesNode = maybeNode &&
                !(maybeNode.type === 'Identifier' && maybeNode.name === 'undefined')
                ? maybeNode
                : undefined;
            const isEffect = /Effect($|[^a-z])/g.test(reactiveHookName);
            if (!callback) {
                reportProblem({
                    node: reactiveHook,
                    message: `React Hook ${reactiveHookName} requires an effect callback. ` +
                        `Did you forget to pass a callback to the hook?`,
                });
                return;
            }
            if (!maybeNode && isEffect && options.requireExplicitEffectDeps) {
                reportProblem({
                    node: reactiveHook,
                    message: `React Hook ${reactiveHookName} always requires dependencies. ` +
                        `Please add a dependency array or an explicit \`undefined\``,
                });
            }
            const isAutoDepsHook = options.experimental_autoDependenciesHooks.includes(reactiveHookName);
            if ((!declaredDependenciesNode ||
                (isAutoDepsHook &&
                    declaredDependenciesNode.type === 'Literal' &&
                    declaredDependenciesNode.value === null)) &&
                !isEffect) {
                if (reactiveHookName === 'useMemo' ||
                    reactiveHookName === 'useCallback') {
                    reportProblem({
                        node: reactiveHook,
                        message: `React Hook ${reactiveHookName} does nothing when called with ` +
                            `only one argument. Did you forget to pass an array of ` +
                            `dependencies?`,
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
                    visitFunctionWithDependencies(callback, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect, isAutoDepsHook);
                    return;
                case 'Identifier':
                    if (!declaredDependenciesNode ||
                        (isAutoDepsHook &&
                            declaredDependenciesNode.type === 'Literal' &&
                            declaredDependenciesNode.value === null)) {
                        return;
                    }
                    if ('elements' in declaredDependenciesNode &&
                        declaredDependenciesNode.elements &&
                        declaredDependenciesNode.elements.some(el => el && el.type === 'Identifier' && el.name === callback.name)) {
                        return;
                    }
                    const variable = getScope(callback).set.get(callback.name);
                    if (variable == null || variable.defs == null) {
                        return;
                    }
                    const def = variable.defs[0];
                    if (!def || !def.node) {
                        break;
                    }
                    if (def.type === 'Parameter') {
                        reportProblem({
                            node: reactiveHook,
                            message: getUnknownDependenciesMessage(reactiveHookName),
                        });
                        return;
                    }
                    if (def.type !== 'Variable' && def.type !== 'FunctionName') {
                        break;
                    }
                    switch (def.node.type) {
                        case 'FunctionDeclaration':
                            visitFunctionWithDependencies(def.node, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect, isAutoDepsHook);
                            return;
                        case 'VariableDeclarator':
                            const init = def.node.init;
                            if (!init) {
                                break;
                            }
                            switch (init.type) {
                                case 'ArrowFunctionExpression':
                                case 'FunctionExpression':
                                    visitFunctionWithDependencies(init, declaredDependenciesNode, reactiveHook, reactiveHookName, isEffect, isAutoDepsHook);
                                    return;
                            }
                            break;
                    }
                    break;
                default:
                    reportProblem({
                        node: reactiveHook,
                        message: getUnknownDependenciesMessage(reactiveHookName),
                    });
                    return;
            }
            reportProblem({
                node: reactiveHook,
                message: `React Hook ${reactiveHookName} has a missing dependency: '${callback.name}'. ` +
                    `Either include it or remove the dependency array.`,
                suggest: [
                    {
                        desc: `Update the dependencies array to be: [${callback.name}]`,
                        fix(fixer) {
                            return fixer.replaceText(declaredDependenciesNode, `[${callback.name}]`);
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
function collectRecommendations({ dependencies, declaredDependencies, stableDependencies, externalDependencies, isEffect, }) {
    const depTree = createDepTree();
    function createDepTree() {
        return {
            isUsed: false,
            isSatisfiedRecursively: false,
            isSubtreeUsed: false,
            children: new Map(),
        };
    }
    dependencies.forEach((_, key) => {
        const node = getOrCreateNodeByPath(depTree, key);
        node.isUsed = true;
        markAllParentsByPath(depTree, key, parent => {
            parent.isSubtreeUsed = true;
        });
    });
    declaredDependencies.forEach(({ key }) => {
        const node = getOrCreateNodeByPath(depTree, key);
        node.isSatisfiedRecursively = true;
    });
    stableDependencies.forEach(key => {
        const node = getOrCreateNodeByPath(depTree, key);
        node.isSatisfiedRecursively = true;
    });
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
    const missingDependencies = new Set();
    const satisfyingDependencies = new Set();
    scanTreeRecursively(depTree, missingDependencies, satisfyingDependencies, key => key);
    function scanTreeRecursively(node, missingPaths, satisfyingPaths, keyToPath) {
        node.children.forEach((child, key) => {
            const path = keyToPath(key);
            if (child.isSatisfiedRecursively) {
                if (child.isSubtreeUsed) {
                    satisfyingPaths.add(path);
                }
                return;
            }
            if (child.isUsed) {
                missingPaths.add(path);
                return;
            }
            scanTreeRecursively(child, missingPaths, satisfyingPaths, childKey => path + '.' + childKey);
        });
    }
    const suggestedDependencies = [];
    const unnecessaryDependencies = new Set();
    const duplicateDependencies = new Set();
    declaredDependencies.forEach(({ key }) => {
        if (satisfyingDependencies.has(key)) {
            if (suggestedDependencies.indexOf(key) === -1) {
                suggestedDependencies.push(key);
            }
            else {
                duplicateDependencies.add(key);
            }
        }
        else {
            if (isEffect &&
                !key.endsWith('.current') &&
                !externalDependencies.has(key)) {
                if (suggestedDependencies.indexOf(key) === -1) {
                    suggestedDependencies.push(key);
                }
            }
            else {
                unnecessaryDependencies.add(key);
            }
        }
    });
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
function scanForConstructions({ declaredDependencies, declaredDependenciesNode, componentScope, scope, }) {
    const constructions = declaredDependencies
        .map(({ key }) => {
        const ref = componentScope.variables.find(v => v.name === key);
        if (ref == null) {
            return null;
        }
        const node = ref.defs[0];
        if (node == null) {
            return null;
        }
        if (node.type === 'Variable' &&
            node.node.type === 'VariableDeclarator' &&
            node.node.id.type === 'Identifier' &&
            node.node.init != null) {
            const constantExpressionType = getConstructionExpressionType(node.node.init);
            if (constantExpressionType) {
                return [ref, constantExpressionType];
            }
        }
        if (node.type === 'FunctionName' &&
            node.node.type === 'FunctionDeclaration') {
            return [ref, 'function'];
        }
        if (node.type === 'ClassName' && node.node.type === 'ClassDeclaration') {
            return [ref, 'class'];
        }
        return null;
    })
        .filter(Boolean);
    function isUsedOutsideOfHook(ref) {
        let foundWriteExpr = false;
        for (const reference of ref.references) {
            if (reference.writeExpr) {
                if (foundWriteExpr) {
                    return true;
                }
                else {
                    foundWriteExpr = true;
                    continue;
                }
            }
            let currentScope = reference.from;
            while (currentScope !== scope && currentScope != null) {
                currentScope = currentScope.upper;
            }
            if (currentScope !== scope) {
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
    else if (node.type === 'MemberExpression' &&
        node.parent &&
        node.parent.type === 'AssignmentExpression' &&
        node.parent.left === node) {
        return node.object;
    }
    else {
        return node;
    }
}
function markNode(node, optionalChains, result) {
    if (optionalChains) {
        if ('optional' in node && node.optional) {
            if (!optionalChains.has(result)) {
                optionalChains.set(result, true);
            }
        }
        else {
            optionalChains.set(result, false);
        }
    }
}
function analyzePropertyChain(node, optionalChains) {
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
        const result = node.name;
        if (optionalChains) {
            optionalChains.set(result, false);
        }
        return result;
    }
    else if (node.type === 'MemberExpression' && !node.computed) {
        const object = analyzePropertyChain(node.object, optionalChains);
        const property = analyzePropertyChain(node.property, null);
        const result = `${object}.${property}`;
        markNode(node, optionalChains, result);
        return result;
    }
    else if (node.type === 'OptionalMemberExpression' && !node.computed) {
        const object = analyzePropertyChain(node.object, optionalChains);
        const property = analyzePropertyChain(node.property, null);
        const result = `${object}.${property}`;
        markNode(node, optionalChains, result);
        return result;
    }
    else if (node.type === 'ChainExpression' &&
        (!('computed' in node) || !node.computed)) {
        const expression = node.expression;
        if (expression.type === 'CallExpression') {
            throw new Error(`Unsupported node type: ${expression.type}`);
        }
        const object = analyzePropertyChain(expression.object, optionalChains);
        const property = analyzePropertyChain(expression.property, null);
        const result = `${object}.${property}`;
        markNode(expression, optionalChains, result);
        return result;
    }
    else {
        throw new Error(`Unsupported node type: ${node.type}`);
    }
}
function getNodeWithoutReactNamespace$1(node) {
    if (node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'React' &&
        node.property.type === 'Identifier' &&
        !node.computed) {
        return node.property;
    }
    return node;
}
function getReactiveHookCallbackIndex(calleeNode, options) {
    const node = getNodeWithoutReactNamespace$1(calleeNode);
    if (node.type !== 'Identifier') {
        return -1;
    }
    switch (node.name) {
        case 'useEffect':
        case 'useLayoutEffect':
        case 'useCallback':
        case 'useMemo':
            return 0;
        case 'useImperativeHandle':
            return 1;
        default:
            if (node === calleeNode && options && options.additionalHooks) {
                let name;
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
function fastFindReferenceWithParent(start, target) {
    const queue = [start];
    let item;
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
            }
            else if (Array.isArray(value)) {
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
function isUseEffectEventIdentifier$1(node) {
    return node.type === 'Identifier' && node.name === 'useEffectEvent';
}
function getUnknownDependenciesMessage(reactiveHookName) {
    return (`React Hook ${reactiveHookName} received a function whose dependencies ` +
        `are unknown. Pass an inline function instead.`);
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var assert_1;
var hasRequiredAssert;
function requireAssert() {
  if (hasRequiredAssert) return assert_1;
  hasRequiredAssert = 1;
  function assert(cond) {
    if (!cond) {
      throw new Error('Assertion violated.');
    }
  }
  assert_1 = assert;
  return assert_1;
}

var codePathSegment;
var hasRequiredCodePathSegment;
function requireCodePathSegment() {
  if (hasRequiredCodePathSegment) return codePathSegment;
  hasRequiredCodePathSegment = 1;

  //------------------------------------------------------------------------------
  // Requirements
  //------------------------------------------------------------------------------

  //------------------------------------------------------------------------------
  // Helpers
  //------------------------------------------------------------------------------

  /**
   * Checks whether or not a given segment is reachable.
   * @param {CodePathSegment} segment A segment to check.
   * @returns {boolean} `true` if the segment is reachable.
   */
  function isReachable(segment) {
    return segment.reachable;
  }

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * A code path segment.
   */
  class CodePathSegment {
    /**
     * @param {string} id An identifier.
     * @param {CodePathSegment[]} allPrevSegments An array of the previous segments.
     *   This array includes unreachable segments.
     * @param {boolean} reachable A flag which shows this is reachable.
     */
    constructor(id, allPrevSegments, reachable) {
      /**
       * The identifier of this code path.
       * Rules use it to store additional information of each rule.
       * @type {string}
       */
      this.id = id;

      /**
       * An array of the next segments.
       * @type {CodePathSegment[]}
       */
      this.nextSegments = [];

      /**
       * An array of the previous segments.
       * @type {CodePathSegment[]}
       */
      this.prevSegments = allPrevSegments.filter(isReachable);

      /**
       * An array of the next segments.
       * This array includes unreachable segments.
       * @type {CodePathSegment[]}
       */
      this.allNextSegments = [];

      /**
       * An array of the previous segments.
       * This array includes unreachable segments.
       * @type {CodePathSegment[]}
       */
      this.allPrevSegments = allPrevSegments;

      /**
       * A flag which shows this is reachable.
       * @type {boolean}
       */
      this.reachable = reachable;

      // Internal data.
      Object.defineProperty(this, 'internal', {
        value: {
          used: false,
          loopedPrevSegments: []
        }
      });
    }

    /**
     * Checks a given previous segment is coming from the end of a loop.
     * @param {CodePathSegment} segment A previous segment to check.
     * @returns {boolean} `true` if the segment is coming from the end of a loop.
     */
    isLoopedPrevSegment(segment) {
      return this.internal.loopedPrevSegments.includes(segment);
    }

    /**
     * Creates the root segment.
     * @param {string} id An identifier.
     * @returns {CodePathSegment} The created segment.
     */
    static newRoot(id) {
      return new CodePathSegment(id, [], true);
    }

    /**
     * Creates a segment that follows given segments.
     * @param {string} id An identifier.
     * @param {CodePathSegment[]} allPrevSegments An array of the previous segments.
     * @returns {CodePathSegment} The created segment.
     */
    static newNext(id, allPrevSegments) {
      return new CodePathSegment(id, CodePathSegment.flattenUnusedSegments(allPrevSegments), allPrevSegments.some(isReachable));
    }

    /**
     * Creates an unreachable segment that follows given segments.
     * @param {string} id An identifier.
     * @param {CodePathSegment[]} allPrevSegments An array of the previous segments.
     * @returns {CodePathSegment} The created segment.
     */
    static newUnreachable(id, allPrevSegments) {
      const segment = new CodePathSegment(id, CodePathSegment.flattenUnusedSegments(allPrevSegments), false);

      /*
       * In `if (a) return a; foo();` case, the unreachable segment preceded by
       * the return statement is not used but must not be remove.
       */
      CodePathSegment.markUsed(segment);
      return segment;
    }

    /**
     * Creates a segment that follows given segments.
     * This factory method does not connect with `allPrevSegments`.
     * But this inherits `reachable` flag.
     * @param {string} id An identifier.
     * @param {CodePathSegment[]} allPrevSegments An array of the previous segments.
     * @returns {CodePathSegment} The created segment.
     */
    static newDisconnected(id, allPrevSegments) {
      return new CodePathSegment(id, [], allPrevSegments.some(isReachable));
    }

    /**
     * Makes a given segment being used.
     *
     * And this function registers the segment into the previous segments as a next.
     * @param {CodePathSegment} segment A segment to mark.
     * @returns {void}
     */
    static markUsed(segment) {
      if (segment.internal.used) {
        return;
      }
      segment.internal.used = true;
      let i;
      if (segment.reachable) {
        for (i = 0; i < segment.allPrevSegments.length; ++i) {
          const prevSegment = segment.allPrevSegments[i];
          prevSegment.allNextSegments.push(segment);
          prevSegment.nextSegments.push(segment);
        }
      } else {
        for (i = 0; i < segment.allPrevSegments.length; ++i) {
          segment.allPrevSegments[i].allNextSegments.push(segment);
        }
      }
    }

    /**
     * Marks a previous segment as looped.
     * @param {CodePathSegment} segment A segment.
     * @param {CodePathSegment} prevSegment A previous segment to mark.
     * @returns {void}
     */
    static markPrevSegmentAsLooped(segment, prevSegment) {
      segment.internal.loopedPrevSegments.push(prevSegment);
    }

    /**
     * Replaces unused segments with the previous segments of each unused segment.
     * @param {CodePathSegment[]} segments An array of segments to replace.
     * @returns {CodePathSegment[]} The replaced array.
     */
    static flattenUnusedSegments(segments) {
      const done = Object.create(null);
      const retv = [];
      for (let i = 0; i < segments.length; ++i) {
        const segment = segments[i];

        // Ignores duplicated.
        if (done[segment.id]) {
          continue;
        }

        // Use previous segments if unused.
        if (!segment.internal.used) {
          for (let j = 0; j < segment.allPrevSegments.length; ++j) {
            const prevSegment = segment.allPrevSegments[j];
            if (!done[prevSegment.id]) {
              done[prevSegment.id] = true;
              retv.push(prevSegment);
            }
          }
        } else {
          done[segment.id] = true;
          retv.push(segment);
        }
      }
      return retv;
    }
  }
  codePathSegment = CodePathSegment;
  return codePathSegment;
}

var forkContext;
var hasRequiredForkContext;
function requireForkContext() {
  if (hasRequiredForkContext) return forkContext;
  hasRequiredForkContext = 1;

  //------------------------------------------------------------------------------
  // Requirements
  //------------------------------------------------------------------------------

  // eslint-disable-next-line
  const assert = requireAssert();
  // eslint-disable-next-line
  const CodePathSegment = requireCodePathSegment();

  //------------------------------------------------------------------------------
  // Helpers
  //------------------------------------------------------------------------------

  /**
   * Gets whether or not a given segment is reachable.
   * @param {CodePathSegment} segment A segment to get.
   * @returns {boolean} `true` if the segment is reachable.
   */
  function isReachable(segment) {
    return segment.reachable;
  }

  /**
   * Creates new segments from the specific range of `context.segmentsList`.
   *
   * When `context.segmentsList` is `[[a, b], [c, d], [e, f]]`, `begin` is `0`, and
   * `end` is `-1`, this creates `[g, h]`. This `g` is from `a`, `c`, and `e`.
   * This `h` is from `b`, `d`, and `f`.
   * @param {ForkContext} context An instance.
   * @param {number} begin The first index of the previous segments.
   * @param {number} end The last index of the previous segments.
   * @param {Function} create A factory function of new segments.
   * @returns {CodePathSegment[]} New segments.
   */
  function makeSegments(context, begin, end, create) {
    const list = context.segmentsList;
    const normalizedBegin = begin >= 0 ? begin : list.length + begin;
    const normalizedEnd = end >= 0 ? end : list.length + end;
    const segments = [];
    for (let i = 0; i < context.count; ++i) {
      const allPrevSegments = [];
      for (let j = normalizedBegin; j <= normalizedEnd; ++j) {
        allPrevSegments.push(list[j][i]);
      }
      segments.push(create(context.idGenerator.next(), allPrevSegments));
    }
    return segments;
  }

  /**
   * `segments` becomes doubly in a `finally` block. Then if a code path exits by a
   * control statement (such as `break`, `continue`) from the `finally` block, the
   * destination's segments may be half of the source segments. In that case, this
   * merges segments.
   * @param {ForkContext} context An instance.
   * @param {CodePathSegment[]} segments Segments to merge.
   * @returns {CodePathSegment[]} The merged segments.
   */
  function mergeExtraSegments(context, segments) {
    let currentSegments = segments;
    while (currentSegments.length > context.count) {
      const merged = [];
      for (let i = 0, length = currentSegments.length / 2 | 0; i < length; ++i) {
        merged.push(CodePathSegment.newNext(context.idGenerator.next(), [currentSegments[i], currentSegments[i + length]]));
      }
      currentSegments = merged;
    }
    return currentSegments;
  }

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * A class to manage forking.
   */
  class ForkContext {
    /**
     * @param {IdGenerator} idGenerator An identifier generator for segments.
     * @param {ForkContext|null} upper An upper fork context.
     * @param {number} count A number of parallel segments.
     */
    constructor(idGenerator, upper, count) {
      this.idGenerator = idGenerator;
      this.upper = upper;
      this.count = count;
      this.segmentsList = [];
    }

    /**
     * The head segments.
     * @type {CodePathSegment[]}
     */
    get head() {
      const list = this.segmentsList;
      return list.length === 0 ? [] : list[list.length - 1];
    }

    /**
     * A flag which shows empty.
     * @type {boolean}
     */
    get empty() {
      return this.segmentsList.length === 0;
    }

    /**
     * A flag which shows reachable.
     * @type {boolean}
     */
    get reachable() {
      const segments = this.head;
      return segments.length > 0 && segments.some(isReachable);
    }

    /**
     * Creates new segments from this context.
     * @param {number} begin The first index of previous segments.
     * @param {number} end The last index of previous segments.
     * @returns {CodePathSegment[]} New segments.
     */
    makeNext(begin, end) {
      return makeSegments(this, begin, end, CodePathSegment.newNext);
    }

    /**
     * Creates new segments from this context.
     * The new segments is always unreachable.
     * @param {number} begin The first index of previous segments.
     * @param {number} end The last index of previous segments.
     * @returns {CodePathSegment[]} New segments.
     */
    makeUnreachable(begin, end) {
      return makeSegments(this, begin, end, CodePathSegment.newUnreachable);
    }

    /**
     * Creates new segments from this context.
     * The new segments don't have connections for previous segments.
     * But these inherit the reachable flag from this context.
     * @param {number} begin The first index of previous segments.
     * @param {number} end The last index of previous segments.
     * @returns {CodePathSegment[]} New segments.
     */
    makeDisconnected(begin, end) {
      return makeSegments(this, begin, end, CodePathSegment.newDisconnected);
    }

    /**
     * Adds segments into this context.
     * The added segments become the head.
     * @param {CodePathSegment[]} segments Segments to add.
     * @returns {void}
     */
    add(segments) {
      assert(segments.length >= this.count, segments.length + " >= " + this.count);
      this.segmentsList.push(mergeExtraSegments(this, segments));
    }

    /**
     * Replaces the head segments with given segments.
     * The current head segments are removed.
     * @param {CodePathSegment[]} segments Segments to add.
     * @returns {void}
     */
    replaceHead(segments) {
      assert(segments.length >= this.count, segments.length + " >= " + this.count);
      this.segmentsList.splice(-1, 1, mergeExtraSegments(this, segments));
    }

    /**
     * Adds all segments of a given fork context into this context.
     * @param {ForkContext} context A fork context to add.
     * @returns {void}
     */
    addAll(context) {
      assert(context.count === this.count);
      const source = context.segmentsList;
      for (let i = 0; i < source.length; ++i) {
        this.segmentsList.push(source[i]);
      }
    }

    /**
     * Clears all segments in this context.
     * @returns {void}
     */
    clear() {
      this.segmentsList = [];
    }

    /**
     * Creates the root fork context.
     * @param {IdGenerator} idGenerator An identifier generator for segments.
     * @returns {ForkContext} New fork context.
     */
    static newRoot(idGenerator) {
      const context = new ForkContext(idGenerator, null, 1);
      context.add([CodePathSegment.newRoot(idGenerator.next())]);
      return context;
    }

    /**
     * Creates an empty fork context preceded by a given context.
     * @param {ForkContext} parentContext The parent fork context.
     * @param {boolean} forkLeavingPath A flag which shows inside of `finally` block.
     * @returns {ForkContext} New fork context.
     */
    static newEmpty(parentContext, forkLeavingPath) {
      return new ForkContext(parentContext.idGenerator, parentContext, (forkLeavingPath ? 2 : 1) * parentContext.count);
    }
  }
  forkContext = ForkContext;
  return forkContext;
}

var codePathState;
var hasRequiredCodePathState;
function requireCodePathState() {
  if (hasRequiredCodePathState) return codePathState;
  hasRequiredCodePathState = 1;

  //------------------------------------------------------------------------------
  // Requirements
  //------------------------------------------------------------------------------

  // eslint-disable-next-line
  const CodePathSegment = requireCodePathSegment();
  // eslint-disable-next-line
  const ForkContext = requireForkContext();

  //------------------------------------------------------------------------------
  // Helpers
  //------------------------------------------------------------------------------

  /**
   * Adds given segments into the `dest` array.
   * If the `others` array does not includes the given segments, adds to the `all`
   * array as well.
   *
   * This adds only reachable and used segments.
   * @param {CodePathSegment[]} dest A destination array (`returnedSegments` or `thrownSegments`).
   * @param {CodePathSegment[]} others Another destination array (`returnedSegments` or `thrownSegments`).
   * @param {CodePathSegment[]} all The unified destination array (`finalSegments`).
   * @param {CodePathSegment[]} segments Segments to add.
   * @returns {void}
   */
  function addToReturnedOrThrown(dest, others, all, segments) {
    for (let i = 0; i < segments.length; ++i) {
      const segment = segments[i];
      dest.push(segment);
      if (!others.includes(segment)) {
        all.push(segment);
      }
    }
  }

  /**
   * Gets a loop-context for a `continue` statement.
   * @param {CodePathState} state A state to get.
   * @param {string} label The label of a `continue` statement.
   * @returns {LoopContext} A loop-context for a `continue` statement.
   */
  function getContinueContext(state, label) {
    if (!label) {
      return state.loopContext;
    }
    let context = state.loopContext;
    while (context) {
      if (context.label === label) {
        return context;
      }
      context = context.upper;
    }

    /* c8 ignore next */
    return null;
  }

  /**
   * Gets a context for a `break` statement.
   * @param {CodePathState} state A state to get.
   * @param {string} label The label of a `break` statement.
   * @returns {LoopContext|SwitchContext} A context for a `break` statement.
   */
  function getBreakContext(state, label) {
    let context = state.breakContext;
    while (context) {
      if (label ? context.label === label : context.breakable) {
        return context;
      }
      context = context.upper;
    }

    /* c8 ignore next */
    return null;
  }

  /**
   * Gets a context for a `return` statement.
   * @param {CodePathState} state A state to get.
   * @returns {TryContext|CodePathState} A context for a `return` statement.
   */
  function getReturnContext(state) {
    let context = state.tryContext;
    while (context) {
      if (context.hasFinalizer && context.position !== 'finally') {
        return context;
      }
      context = context.upper;
    }
    return state;
  }

  /**
   * Gets a context for a `throw` statement.
   * @param {CodePathState} state A state to get.
   * @returns {TryContext|CodePathState} A context for a `throw` statement.
   */
  function getThrowContext(state) {
    let context = state.tryContext;
    while (context) {
      if (context.position === 'try' || context.hasFinalizer && context.position === 'catch') {
        return context;
      }
      context = context.upper;
    }
    return state;
  }

  /**
   * Removes a given element from a given array.
   * @param {any[]} xs An array to remove the specific element.
   * @param {any} x An element to be removed.
   * @returns {void}
   */
  function remove(xs, x) {
    xs.splice(xs.indexOf(x), 1);
  }

  /**
   * Disconnect given segments.
   *
   * This is used in a process for switch statements.
   * If there is the "default" chunk before other cases, the order is different
   * between node's and running's.
   * @param {CodePathSegment[]} prevSegments Forward segments to disconnect.
   * @param {CodePathSegment[]} nextSegments Backward segments to disconnect.
   * @returns {void}
   */
  function removeConnection(prevSegments, nextSegments) {
    for (let i = 0; i < prevSegments.length; ++i) {
      const prevSegment = prevSegments[i];
      const nextSegment = nextSegments[i];
      remove(prevSegment.nextSegments, nextSegment);
      remove(prevSegment.allNextSegments, nextSegment);
      remove(nextSegment.prevSegments, prevSegment);
      remove(nextSegment.allPrevSegments, prevSegment);
    }
  }

  /**
   * Creates looping path.
   * @param {CodePathState} state The instance.
   * @param {CodePathSegment[]} unflattenedFromSegments Segments which are source.
   * @param {CodePathSegment[]} unflattenedToSegments Segments which are destination.
   * @returns {void}
   */
  function makeLooped(state, unflattenedFromSegments, unflattenedToSegments) {
    const fromSegments = CodePathSegment.flattenUnusedSegments(unflattenedFromSegments);
    const toSegments = CodePathSegment.flattenUnusedSegments(unflattenedToSegments);
    const end = Math.min(fromSegments.length, toSegments.length);
    for (let i = 0; i < end; ++i) {
      const fromSegment = fromSegments[i];
      const toSegment = toSegments[i];
      if (toSegment.reachable) {
        fromSegment.nextSegments.push(toSegment);
      }
      if (fromSegment.reachable) {
        toSegment.prevSegments.push(fromSegment);
      }
      fromSegment.allNextSegments.push(toSegment);
      toSegment.allPrevSegments.push(fromSegment);
      if (toSegment.allPrevSegments.length >= 2) {
        CodePathSegment.markPrevSegmentAsLooped(toSegment, fromSegment);
      }
      state.notifyLooped(fromSegment, toSegment);
    }
  }

  /**
   * Finalizes segments of `test` chunk of a ForStatement.
   *
   * - Adds `false` paths to paths which are leaving from the loop.
   * - Sets `true` paths to paths which go to the body.
   * @param {LoopContext} context A loop context to modify.
   * @param {ChoiceContext} choiceContext A choice context of this loop.
   * @param {CodePathSegment[]} head The current head paths.
   * @returns {void}
   */
  function finalizeTestSegmentsOfFor(context, choiceContext, head) {
    if (!choiceContext.processed) {
      choiceContext.trueForkContext.add(head);
      choiceContext.falseForkContext.add(head);
      choiceContext.qqForkContext.add(head);
    }
    if (context.test !== true) {
      context.brokenForkContext.addAll(choiceContext.falseForkContext);
    }
    context.endOfTestSegments = choiceContext.trueForkContext.makeNext(0, -1);
  }

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * A class which manages state to analyze code paths.
   */
  class CodePathState {
    /**
     * @param {IdGenerator} idGenerator An id generator to generate id for code
     *   path segments.
     * @param {Function} onLooped A callback function to notify looping.
     */
    constructor(idGenerator, onLooped) {
      this.idGenerator = idGenerator;
      this.notifyLooped = onLooped;
      this.forkContext = ForkContext.newRoot(idGenerator);
      this.choiceContext = null;
      this.switchContext = null;
      this.tryContext = null;
      this.loopContext = null;
      this.breakContext = null;
      this.chainContext = null;
      this.currentSegments = [];
      this.initialSegment = this.forkContext.head[0];

      // returnedSegments and thrownSegments push elements into finalSegments also.
      const final = this.finalSegments = [];
      const returned = this.returnedForkContext = [];
      const thrown = this.thrownForkContext = [];
      returned.add = addToReturnedOrThrown.bind(null, returned, thrown, final);
      thrown.add = addToReturnedOrThrown.bind(null, thrown, returned, final);
    }

    /**
     * The head segments.
     * @type {CodePathSegment[]}
     */
    get headSegments() {
      return this.forkContext.head;
    }

    /**
     * The parent forking context.
     * This is used for the root of new forks.
     * @type {ForkContext}
     */
    get parentForkContext() {
      const current = this.forkContext;
      return current && current.upper;
    }

    /**
     * Creates and stacks new forking context.
     * @param {boolean} forkLeavingPath A flag which shows being in a
     *   "finally" block.
     * @returns {ForkContext} The created context.
     */
    pushForkContext(forkLeavingPath) {
      this.forkContext = ForkContext.newEmpty(this.forkContext, forkLeavingPath);
      return this.forkContext;
    }

    /**
     * Pops and merges the last forking context.
     * @returns {ForkContext} The last context.
     */
    popForkContext() {
      const lastContext = this.forkContext;
      this.forkContext = lastContext.upper;
      this.forkContext.replaceHead(lastContext.makeNext(0, -1));
      return lastContext;
    }

    /**
     * Creates a new path.
     * @returns {void}
     */
    forkPath() {
      this.forkContext.add(this.parentForkContext.makeNext(-1, -1));
    }

    /**
     * Creates a bypass path.
     * This is used for such as IfStatement which does not have "else" chunk.
     * @returns {void}
     */
    forkBypassPath() {
      this.forkContext.add(this.parentForkContext.head);
    }

    //--------------------------------------------------------------------------
    // ConditionalExpression, LogicalExpression, IfStatement
    //--------------------------------------------------------------------------

    /**
     * Creates a context for ConditionalExpression, LogicalExpression, AssignmentExpression (logical assignments only),
     * IfStatement, WhileStatement, DoWhileStatement, or ForStatement.
     *
     * LogicalExpressions have cases that it goes different paths between the
     * `true` case and the `false` case.
     *
     * For Example:
     *
     *     if (a || b) {
     *         foo();
     *     } else {
     *         bar();
     *     }
     *
     * In this case, `b` is evaluated always in the code path of the `else`
     * block, but it's not so in the code path of the `if` block.
     * So there are 3 paths.
     *
     *     a -> foo();
     *     a -> b -> foo();
     *     a -> b -> bar();
     * @param {string} kind A kind string.
     *   If the new context is LogicalExpression's or AssignmentExpression's, this is `"&&"` or `"||"` or `"??"`.
     *   If it's IfStatement's or ConditionalExpression's, this is `"test"`.
     *   Otherwise, this is `"loop"`.
     * @param {boolean} isForkingAsResult A flag that shows that goes different
     *   paths between `true` and `false`.
     * @returns {void}
     */
    pushChoiceContext(kind, isForkingAsResult) {
      this.choiceContext = {
        upper: this.choiceContext,
        kind,
        isForkingAsResult,
        trueForkContext: ForkContext.newEmpty(this.forkContext),
        falseForkContext: ForkContext.newEmpty(this.forkContext),
        qqForkContext: ForkContext.newEmpty(this.forkContext),
        processed: false
      };
    }

    /**
     * Pops the last choice context and finalizes it.
     * @throws {Error} (Unreachable.)
     * @returns {ChoiceContext} The popped context.
     */
    popChoiceContext() {
      const context = this.choiceContext;
      this.choiceContext = context.upper;
      const forkContext = this.forkContext;
      const headSegments = forkContext.head;
      switch (context.kind) {
        case '&&':
        case '||':
        case '??':
          /*
           * If any result were not transferred from child contexts,
           * this sets the head segments to both cases.
           * The head segments are the path of the right-hand operand.
           */
          if (!context.processed) {
            context.trueForkContext.add(headSegments);
            context.falseForkContext.add(headSegments);
            context.qqForkContext.add(headSegments);
          }

          /*
           * Transfers results to upper context if this context is in
           * test chunk.
           */
          if (context.isForkingAsResult) {
            const parentContext = this.choiceContext;
            parentContext.trueForkContext.addAll(context.trueForkContext);
            parentContext.falseForkContext.addAll(context.falseForkContext);
            parentContext.qqForkContext.addAll(context.qqForkContext);
            parentContext.processed = true;
            return context;
          }
          break;
        case 'test':
          if (!context.processed) {
            /*
             * The head segments are the path of the `if` block here.
             * Updates the `true` path with the end of the `if` block.
             */
            context.trueForkContext.clear();
            context.trueForkContext.add(headSegments);
          } else {
            /*
             * The head segments are the path of the `else` block here.
             * Updates the `false` path with the end of the `else`
             * block.
             */
            context.falseForkContext.clear();
            context.falseForkContext.add(headSegments);
          }
          break;
        case 'loop':
          /*
           * Loops are addressed in popLoopContext().
           * This is called from popLoopContext().
           */
          return context;

        /* c8 ignore next */
        default:
          throw new Error('unreachable');
      }

      // Merges all paths.
      const prevForkContext = context.trueForkContext;
      prevForkContext.addAll(context.falseForkContext);
      forkContext.replaceHead(prevForkContext.makeNext(0, -1));
      return context;
    }

    /**
     * Makes a code path segment of the right-hand operand of a logical
     * expression.
     * @throws {Error} (Unreachable.)
     * @returns {void}
     */
    makeLogicalRight() {
      const context = this.choiceContext;
      const forkContext = this.forkContext;
      if (context.processed) {
        /*
         * This got segments already from the child choice context.
         * Creates the next path from own true/false fork context.
         */
        let prevForkContext;
        switch (context.kind) {
          case '&&':
            // if true then go to the right-hand side.
            prevForkContext = context.trueForkContext;
            break;
          case '||':
            // if false then go to the right-hand side.
            prevForkContext = context.falseForkContext;
            break;
          case '??':
            // Both true/false can short-circuit, so needs the third path to go to the right-hand side. That's qqForkContext.
            prevForkContext = context.qqForkContext;
            break;
          default:
            throw new Error('unreachable');
        }
        forkContext.replaceHead(prevForkContext.makeNext(0, -1));
        prevForkContext.clear();
        context.processed = false;
      } else {
        /*
         * This did not get segments from the child choice context.
         * So addresses the head segments.
         * The head segments are the path of the left-hand operand.
         */
        switch (context.kind) {
          case '&&':
            // the false path can short-circuit.
            context.falseForkContext.add(forkContext.head);
            break;
          case '||':
            // the true path can short-circuit.
            context.trueForkContext.add(forkContext.head);
            break;
          case '??':
            // both can short-circuit.
            context.trueForkContext.add(forkContext.head);
            context.falseForkContext.add(forkContext.head);
            break;
          default:
            throw new Error('unreachable');
        }
        forkContext.replaceHead(forkContext.makeNext(-1, -1));
      }
    }

    /**
     * Makes a code path segment of the `if` block.
     * @returns {void}
     */
    makeIfConsequent() {
      const context = this.choiceContext;
      const forkContext = this.forkContext;

      /*
       * If any result were not transferred from child contexts,
       * this sets the head segments to both cases.
       * The head segments are the path of the test expression.
       */
      if (!context.processed) {
        context.trueForkContext.add(forkContext.head);
        context.falseForkContext.add(forkContext.head);
        context.qqForkContext.add(forkContext.head);
      }
      context.processed = false;

      // Creates new path from the `true` case.
      forkContext.replaceHead(context.trueForkContext.makeNext(0, -1));
    }

    /**
     * Makes a code path segment of the `else` block.
     * @returns {void}
     */
    makeIfAlternate() {
      const context = this.choiceContext;
      const forkContext = this.forkContext;

      /*
       * The head segments are the path of the `if` block.
       * Updates the `true` path with the end of the `if` block.
       */
      context.trueForkContext.clear();
      context.trueForkContext.add(forkContext.head);
      context.processed = true;

      // Creates new path from the `false` case.
      forkContext.replaceHead(context.falseForkContext.makeNext(0, -1));
    }

    //--------------------------------------------------------------------------
    // ChainExpression
    //--------------------------------------------------------------------------

    /**
     * Push a new `ChainExpression` context to the stack.
     * This method is called on entering to each `ChainExpression` node.
     * This context is used to count forking in the optional chain then merge them on the exiting from the `ChainExpression` node.
     * @returns {void}
     */
    pushChainContext() {
      this.chainContext = {
        upper: this.chainContext,
        countChoiceContexts: 0
      };
    }

    /**
     * Pop a `ChainExpression` context from the stack.
     * This method is called on exiting from each `ChainExpression` node.
     * This merges all forks of the last optional chaining.
     * @returns {void}
     */
    popChainContext() {
      const context = this.chainContext;
      this.chainContext = context.upper;

      // pop all choice contexts of this.
      for (let i = context.countChoiceContexts; i > 0; --i) {
        this.popChoiceContext();
      }
    }

    /**
     * Create a choice context for optional access.
     * This method is called on entering to each `(Call|Member)Expression[optional=true]` node.
     * This creates a choice context as similar to `LogicalExpression[operator="??"]` node.
     * @returns {void}
     */
    makeOptionalNode() {
      if (this.chainContext) {
        this.chainContext.countChoiceContexts += 1;
        this.pushChoiceContext('??', false);
      }
    }

    /**
     * Create a fork.
     * This method is called on entering to the `arguments|property` property of each `(Call|Member)Expression` node.
     * @returns {void}
     */
    makeOptionalRight() {
      if (this.chainContext) {
        this.makeLogicalRight();
      }
    }

    //--------------------------------------------------------------------------
    // SwitchStatement
    //--------------------------------------------------------------------------

    /**
     * Creates a context object of SwitchStatement and stacks it.
     * @param {boolean} hasCase `true` if the switch statement has one or more
     *   case parts.
     * @param {string|null} label The label text.
     * @returns {void}
     */
    pushSwitchContext(hasCase, label) {
      this.switchContext = {
        upper: this.switchContext,
        hasCase,
        defaultSegments: null,
        defaultBodySegments: null,
        foundDefault: false,
        lastIsDefault: false,
        countForks: 0
      };
      this.pushBreakContext(true, label);
    }

    /**
     * Pops the last context of SwitchStatement and finalizes it.
     *
     * - Disposes all forking stack for `case` and `default`.
     * - Creates the next code path segment from `context.brokenForkContext`.
     * - If the last `SwitchCase` node is not a `default` part, creates a path
     *   to the `default` body.
     * @returns {void}
     */
    popSwitchContext() {
      const context = this.switchContext;
      this.switchContext = context.upper;
      const forkContext = this.forkContext;
      const brokenForkContext = this.popBreakContext().brokenForkContext;
      if (context.countForks === 0) {
        /*
         * When there is only one `default` chunk and there is one or more
         * `break` statements, even if forks are nothing, it needs to merge
         * those.
         */
        if (!brokenForkContext.empty) {
          brokenForkContext.add(forkContext.makeNext(-1, -1));
          forkContext.replaceHead(brokenForkContext.makeNext(0, -1));
        }
        return;
      }
      const lastSegments = forkContext.head;
      this.forkBypassPath();
      const lastCaseSegments = forkContext.head;

      /*
       * `brokenForkContext` is used to make the next segment.
       * It must add the last segment into `brokenForkContext`.
       */
      brokenForkContext.add(lastSegments);

      /*
       * A path which is failed in all case test should be connected to path
       * of `default` chunk.
       */
      if (!context.lastIsDefault) {
        if (context.defaultBodySegments) {
          /*
           * Remove a link from `default` label to its chunk.
           * It's false route.
           */
          removeConnection(context.defaultSegments, context.defaultBodySegments);
          makeLooped(this, lastCaseSegments, context.defaultBodySegments);
        } else {
          /*
           * It handles the last case body as broken if `default` chunk
           * does not exist.
           */
          brokenForkContext.add(lastCaseSegments);
        }
      }

      // Pops the segment context stack until the entry segment.
      for (let i = 0; i < context.countForks; ++i) {
        this.forkContext = this.forkContext.upper;
      }

      /*
       * Creates a path from all brokenForkContext paths.
       * This is a path after switch statement.
       */
      this.forkContext.replaceHead(brokenForkContext.makeNext(0, -1));
    }

    /**
     * Makes a code path segment for a `SwitchCase` node.
     * @param {boolean} isEmpty `true` if the body is empty.
     * @param {boolean} isDefault `true` if the body is the default case.
     * @returns {void}
     */
    makeSwitchCaseBody(isEmpty, isDefault) {
      const context = this.switchContext;
      if (!context.hasCase) {
        return;
      }

      /*
       * Merge forks.
       * The parent fork context has two segments.
       * Those are from the current case and the body of the previous case.
       */
      const parentForkContext = this.forkContext;
      const forkContext = this.pushForkContext();
      forkContext.add(parentForkContext.makeNext(0, -1));

      /*
       * Save `default` chunk info.
       * If the `default` label is not at the last, we must make a path from
       * the last `case` to the `default` chunk.
       */
      if (isDefault) {
        context.defaultSegments = parentForkContext.head;
        if (isEmpty) {
          context.foundDefault = true;
        } else {
          context.defaultBodySegments = forkContext.head;
        }
      } else {
        if (!isEmpty && context.foundDefault) {
          context.foundDefault = false;
          context.defaultBodySegments = forkContext.head;
        }
      }
      context.lastIsDefault = isDefault;
      context.countForks += 1;
    }

    //--------------------------------------------------------------------------
    // TryStatement
    //--------------------------------------------------------------------------

    /**
     * Creates a context object of TryStatement and stacks it.
     * @param {boolean} hasFinalizer `true` if the try statement has a
     *   `finally` block.
     * @returns {void}
     */
    pushTryContext(hasFinalizer) {
      this.tryContext = {
        upper: this.tryContext,
        position: 'try',
        hasFinalizer,
        returnedForkContext: hasFinalizer ? ForkContext.newEmpty(this.forkContext) : null,
        thrownForkContext: ForkContext.newEmpty(this.forkContext),
        lastOfTryIsReachable: false,
        lastOfCatchIsReachable: false
      };
    }

    /**
     * Pops the last context of TryStatement and finalizes it.
     * @returns {void}
     */
    popTryContext() {
      const context = this.tryContext;
      this.tryContext = context.upper;
      if (context.position === 'catch') {
        // Merges two paths from the `try` block and `catch` block merely.
        this.popForkContext();
        return;
      }

      /*
       * The following process is executed only when there is the `finally`
       * block.
       */

      const returned = context.returnedForkContext;
      const thrown = context.thrownForkContext;
      if (returned.empty && thrown.empty) {
        return;
      }

      // Separate head to normal paths and leaving paths.
      const headSegments = this.forkContext.head;
      this.forkContext = this.forkContext.upper;
      const normalSegments = headSegments.slice(0, headSegments.length / 2 | 0);
      const leavingSegments = headSegments.slice(headSegments.length / 2 | 0);

      // Forwards the leaving path to upper contexts.
      if (!returned.empty) {
        getReturnContext(this).returnedForkContext.add(leavingSegments);
      }
      if (!thrown.empty) {
        getThrowContext(this).thrownForkContext.add(leavingSegments);
      }

      // Sets the normal path as the next.
      this.forkContext.replaceHead(normalSegments);

      /*
       * If both paths of the `try` block and the `catch` block are
       * unreachable, the next path becomes unreachable as well.
       */
      if (!context.lastOfTryIsReachable && !context.lastOfCatchIsReachable) {
        this.forkContext.makeUnreachable();
      }
    }

    /**
     * Makes a code path segment for a `catch` block.
     * @returns {void}
     */
    makeCatchBlock() {
      const context = this.tryContext;
      const forkContext = this.forkContext;
      const thrown = context.thrownForkContext;

      // Update state.
      context.position = 'catch';
      context.thrownForkContext = ForkContext.newEmpty(forkContext);
      context.lastOfTryIsReachable = forkContext.reachable;

      // Merge thrown paths.
      thrown.add(forkContext.head);
      const thrownSegments = thrown.makeNext(0, -1);

      // Fork to a bypass and the merged thrown path.
      this.pushForkContext();
      this.forkBypassPath();
      this.forkContext.add(thrownSegments);
    }

    /**
     * Makes a code path segment for a `finally` block.
     *
     * In the `finally` block, parallel paths are created. The parallel paths
     * are used as leaving-paths. The leaving-paths are paths from `return`
     * statements and `throw` statements in a `try` block or a `catch` block.
     * @returns {void}
     */
    makeFinallyBlock() {
      const context = this.tryContext;
      let forkContext = this.forkContext;
      const returned = context.returnedForkContext;
      const thrown = context.thrownForkContext;
      const headOfLeavingSegments = forkContext.head;

      // Update state.
      if (context.position === 'catch') {
        // Merges two paths from the `try` block and `catch` block.
        this.popForkContext();
        forkContext = this.forkContext;
        context.lastOfCatchIsReachable = forkContext.reachable;
      } else {
        context.lastOfTryIsReachable = forkContext.reachable;
      }
      context.position = 'finally';
      if (returned.empty && thrown.empty) {
        // This path does not leave.
        return;
      }

      /*
       * Create a parallel segment from merging returned and thrown.
       * This segment will leave at the end of this finally block.
       */
      const segments = forkContext.makeNext(-1, -1);
      for (let i = 0; i < forkContext.count; ++i) {
        const prevSegsOfLeavingSegment = [headOfLeavingSegments[i]];
        for (let j = 0; j < returned.segmentsList.length; ++j) {
          prevSegsOfLeavingSegment.push(returned.segmentsList[j][i]);
        }
        for (let j = 0; j < thrown.segmentsList.length; ++j) {
          prevSegsOfLeavingSegment.push(thrown.segmentsList[j][i]);
        }
        segments.push(CodePathSegment.newNext(this.idGenerator.next(), prevSegsOfLeavingSegment));
      }
      this.pushForkContext(true);
      this.forkContext.add(segments);
    }

    /**
     * Makes a code path segment from the first throwable node to the `catch`
     * block or the `finally` block.
     * @returns {void}
     */
    makeFirstThrowablePathInTryBlock() {
      const forkContext = this.forkContext;
      if (!forkContext.reachable) {
        return;
      }
      const context = getThrowContext(this);
      if (context === this || context.position !== 'try' || !context.thrownForkContext.empty) {
        return;
      }
      context.thrownForkContext.add(forkContext.head);
      forkContext.replaceHead(forkContext.makeNext(-1, -1));
    }

    //--------------------------------------------------------------------------
    // Loop Statements
    //--------------------------------------------------------------------------

    /**
     * Creates a context object of a loop statement and stacks it.
     * @param {string} type The type of the node which was triggered. One of
     *   `WhileStatement`, `DoWhileStatement`, `ForStatement`, `ForInStatement`,
     *   and `ForStatement`.
     * @param {string|null} label A label of the node which was triggered.
     * @throws {Error} (Unreachable - unknown type.)
     * @returns {void}
     */
    pushLoopContext(type, label) {
      const forkContext = this.forkContext;
      const breakContext = this.pushBreakContext(true, label);
      switch (type) {
        case 'WhileStatement':
          this.pushChoiceContext('loop', false);
          this.loopContext = {
            upper: this.loopContext,
            type,
            label,
            test: void 0,
            continueDestSegments: null,
            brokenForkContext: breakContext.brokenForkContext
          };
          break;
        case 'DoWhileStatement':
          this.pushChoiceContext('loop', false);
          this.loopContext = {
            upper: this.loopContext,
            type,
            label,
            test: void 0,
            entrySegments: null,
            continueForkContext: ForkContext.newEmpty(forkContext),
            brokenForkContext: breakContext.brokenForkContext
          };
          break;
        case 'ForStatement':
          this.pushChoiceContext('loop', false);
          this.loopContext = {
            upper: this.loopContext,
            type,
            label,
            test: void 0,
            endOfInitSegments: null,
            testSegments: null,
            endOfTestSegments: null,
            updateSegments: null,
            endOfUpdateSegments: null,
            continueDestSegments: null,
            brokenForkContext: breakContext.brokenForkContext
          };
          break;
        case 'ForInStatement':
        case 'ForOfStatement':
          this.loopContext = {
            upper: this.loopContext,
            type,
            label,
            prevSegments: null,
            leftSegments: null,
            endOfLeftSegments: null,
            continueDestSegments: null,
            brokenForkContext: breakContext.brokenForkContext
          };
          break;

        /* c8 ignore next */
        default:
          throw new Error("unknown type: \"" + type + "\"");
      }
    }

    /**
     * Pops the last context of a loop statement and finalizes it.
     * @throws {Error} (Unreachable - unknown type.)
     * @returns {void}
     */
    popLoopContext() {
      const context = this.loopContext;
      this.loopContext = context.upper;
      const forkContext = this.forkContext;
      const brokenForkContext = this.popBreakContext().brokenForkContext;

      // Creates a looped path.
      switch (context.type) {
        case 'WhileStatement':
        case 'ForStatement':
          this.popChoiceContext();
          makeLooped(this, forkContext.head, context.continueDestSegments);
          break;
        case 'DoWhileStatement':
          {
            const choiceContext = this.popChoiceContext();
            if (!choiceContext.processed) {
              choiceContext.trueForkContext.add(forkContext.head);
              choiceContext.falseForkContext.add(forkContext.head);
            }
            if (context.test !== true) {
              brokenForkContext.addAll(choiceContext.falseForkContext);
            }

            // `true` paths go to looping.
            const segmentsList = choiceContext.trueForkContext.segmentsList;
            for (let i = 0; i < segmentsList.length; ++i) {
              makeLooped(this, segmentsList[i], context.entrySegments);
            }
            break;
          }
        case 'ForInStatement':
        case 'ForOfStatement':
          brokenForkContext.add(forkContext.head);
          makeLooped(this, forkContext.head, context.leftSegments);
          break;

        /* c8 ignore next */
        default:
          throw new Error('unreachable');
      }

      // Go next.
      if (brokenForkContext.empty) {
        forkContext.replaceHead(forkContext.makeUnreachable(-1, -1));
      } else {
        forkContext.replaceHead(brokenForkContext.makeNext(0, -1));
      }
    }

    /**
     * Makes a code path segment for the test part of a WhileStatement.
     * @param {boolean|undefined} test The test value (only when constant).
     * @returns {void}
     */
    makeWhileTest(test) {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const testSegments = forkContext.makeNext(0, -1);

      // Update state.
      context.test = test;
      context.continueDestSegments = testSegments;
      forkContext.replaceHead(testSegments);
    }

    /**
     * Makes a code path segment for the body part of a WhileStatement.
     * @returns {void}
     */
    makeWhileBody() {
      const context = this.loopContext;
      const choiceContext = this.choiceContext;
      const forkContext = this.forkContext;
      if (!choiceContext.processed) {
        choiceContext.trueForkContext.add(forkContext.head);
        choiceContext.falseForkContext.add(forkContext.head);
      }

      // Update state.
      if (context.test !== true) {
        context.brokenForkContext.addAll(choiceContext.falseForkContext);
      }
      forkContext.replaceHead(choiceContext.trueForkContext.makeNext(0, -1));
    }

    /**
     * Makes a code path segment for the body part of a DoWhileStatement.
     * @returns {void}
     */
    makeDoWhileBody() {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const bodySegments = forkContext.makeNext(-1, -1);

      // Update state.
      context.entrySegments = bodySegments;
      forkContext.replaceHead(bodySegments);
    }

    /**
     * Makes a code path segment for the test part of a DoWhileStatement.
     * @param {boolean|undefined} test The test value (only when constant).
     * @returns {void}
     */
    makeDoWhileTest(test) {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      context.test = test;

      // Creates paths of `continue` statements.
      if (!context.continueForkContext.empty) {
        context.continueForkContext.add(forkContext.head);
        const testSegments = context.continueForkContext.makeNext(0, -1);
        forkContext.replaceHead(testSegments);
      }
    }

    /**
     * Makes a code path segment for the test part of a ForStatement.
     * @param {boolean|undefined} test The test value (only when constant).
     * @returns {void}
     */
    makeForTest(test) {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const endOfInitSegments = forkContext.head;
      const testSegments = forkContext.makeNext(-1, -1);

      // Update state.
      context.test = test;
      context.endOfInitSegments = endOfInitSegments;
      context.continueDestSegments = context.testSegments = testSegments;
      forkContext.replaceHead(testSegments);
    }

    /**
     * Makes a code path segment for the update part of a ForStatement.
     * @returns {void}
     */
    makeForUpdate() {
      const context = this.loopContext;
      const choiceContext = this.choiceContext;
      const forkContext = this.forkContext;

      // Make the next paths of the test.
      if (context.testSegments) {
        finalizeTestSegmentsOfFor(context, choiceContext, forkContext.head);
      } else {
        context.endOfInitSegments = forkContext.head;
      }

      // Update state.
      const updateSegments = forkContext.makeDisconnected(-1, -1);
      context.continueDestSegments = context.updateSegments = updateSegments;
      forkContext.replaceHead(updateSegments);
    }

    /**
     * Makes a code path segment for the body part of a ForStatement.
     * @returns {void}
     */
    makeForBody() {
      const context = this.loopContext;
      const choiceContext = this.choiceContext;
      const forkContext = this.forkContext;

      // Update state.
      if (context.updateSegments) {
        context.endOfUpdateSegments = forkContext.head;

        // `update` -> `test`
        if (context.testSegments) {
          makeLooped(this, context.endOfUpdateSegments, context.testSegments);
        }
      } else if (context.testSegments) {
        finalizeTestSegmentsOfFor(context, choiceContext, forkContext.head);
      } else {
        context.endOfInitSegments = forkContext.head;
      }
      let bodySegments = context.endOfTestSegments;
      if (!bodySegments) {
        /*
         * If there is not the `test` part, the `body` path comes from the
         * `init` part and the `update` part.
         */
        const prevForkContext = ForkContext.newEmpty(forkContext);
        prevForkContext.add(context.endOfInitSegments);
        if (context.endOfUpdateSegments) {
          prevForkContext.add(context.endOfUpdateSegments);
        }
        bodySegments = prevForkContext.makeNext(0, -1);
      }
      context.continueDestSegments = context.continueDestSegments || bodySegments;
      forkContext.replaceHead(bodySegments);
    }

    /**
     * Makes a code path segment for the left part of a ForInStatement and a
     * ForOfStatement.
     * @returns {void}
     */
    makeForInOfLeft() {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const leftSegments = forkContext.makeDisconnected(-1, -1);

      // Update state.
      context.prevSegments = forkContext.head;
      context.leftSegments = context.continueDestSegments = leftSegments;
      forkContext.replaceHead(leftSegments);
    }

    /**
     * Makes a code path segment for the right part of a ForInStatement and a
     * ForOfStatement.
     * @returns {void}
     */
    makeForInOfRight() {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const temp = ForkContext.newEmpty(forkContext);
      temp.add(context.prevSegments);
      const rightSegments = temp.makeNext(-1, -1);

      // Update state.
      context.endOfLeftSegments = forkContext.head;
      forkContext.replaceHead(rightSegments);
    }

    /**
     * Makes a code path segment for the body part of a ForInStatement and a
     * ForOfStatement.
     * @returns {void}
     */
    makeForInOfBody() {
      const context = this.loopContext;
      const forkContext = this.forkContext;
      const temp = ForkContext.newEmpty(forkContext);
      temp.add(context.endOfLeftSegments);
      const bodySegments = temp.makeNext(-1, -1);

      // Make a path: `right` -> `left`.
      makeLooped(this, forkContext.head, context.leftSegments);

      // Update state.
      context.brokenForkContext.add(forkContext.head);
      forkContext.replaceHead(bodySegments);
    }

    //--------------------------------------------------------------------------
    // Control Statements
    //--------------------------------------------------------------------------

    /**
     * Creates new context for BreakStatement.
     * @param {boolean} breakable The flag to indicate it can break by
     *      an unlabeled BreakStatement.
     * @param {string|null} label The label of this context.
     * @returns {Object} The new context.
     */
    pushBreakContext(breakable, label) {
      this.breakContext = {
        upper: this.breakContext,
        breakable,
        label,
        brokenForkContext: ForkContext.newEmpty(this.forkContext)
      };
      return this.breakContext;
    }

    /**
     * Removes the top item of the break context stack.
     * @returns {Object} The removed context.
     */
    popBreakContext() {
      const context = this.breakContext;
      const forkContext = this.forkContext;
      this.breakContext = context.upper;

      // Process this context here for other than switches and loops.
      if (!context.breakable) {
        const brokenForkContext = context.brokenForkContext;
        if (!brokenForkContext.empty) {
          brokenForkContext.add(forkContext.head);
          forkContext.replaceHead(brokenForkContext.makeNext(0, -1));
        }
      }
      return context;
    }

    /**
     * Makes a path for a `break` statement.
     *
     * It registers the head segment to a context of `break`.
     * It makes new unreachable segment, then it set the head with the segment.
     * @param {string} label A label of the break statement.
     * @returns {void}
     */
    makeBreak(label) {
      const forkContext = this.forkContext;
      if (!forkContext.reachable) {
        return;
      }
      const context = getBreakContext(this, label);
      if (context) {
        context.brokenForkContext.add(forkContext.head);
      }

      /* c8 ignore next */
      forkContext.replaceHead(forkContext.makeUnreachable(-1, -1));
    }

    /**
     * Makes a path for a `continue` statement.
     *
     * It makes a looping path.
     * It makes new unreachable segment, then it set the head with the segment.
     * @param {string} label A label of the continue statement.
     * @returns {void}
     */
    makeContinue(label) {
      const forkContext = this.forkContext;
      if (!forkContext.reachable) {
        return;
      }
      const context = getContinueContext(this, label);
      if (context) {
        if (context.continueDestSegments) {
          makeLooped(this, forkContext.head, context.continueDestSegments);

          // If the context is a for-in/of loop, this effects a break also.
          if (context.type === 'ForInStatement' || context.type === 'ForOfStatement') {
            context.brokenForkContext.add(forkContext.head);
          }
        } else {
          context.continueForkContext.add(forkContext.head);
        }
      }
      forkContext.replaceHead(forkContext.makeUnreachable(-1, -1));
    }

    /**
     * Makes a path for a `return` statement.
     *
     * It registers the head segment to a context of `return`.
     * It makes new unreachable segment, then it set the head with the segment.
     * @returns {void}
     */
    makeReturn() {
      const forkContext = this.forkContext;
      if (forkContext.reachable) {
        getReturnContext(this).returnedForkContext.add(forkContext.head);
        forkContext.replaceHead(forkContext.makeUnreachable(-1, -1));
      }
    }

    /**
     * Makes a path for a `throw` statement.
     *
     * It registers the head segment to a context of `throw`.
     * It makes new unreachable segment, then it set the head with the segment.
     * @returns {void}
     */
    makeThrow() {
      const forkContext = this.forkContext;
      if (forkContext.reachable) {
        getThrowContext(this).thrownForkContext.add(forkContext.head);
        forkContext.replaceHead(forkContext.makeUnreachable(-1, -1));
      }
    }

    /**
     * Makes the final path.
     * @returns {void}
     */
    makeFinal() {
      const segments = this.currentSegments;
      if (segments.length > 0 && segments[0].reachable) {
        this.returnedForkContext.add(segments);
      }
    }
  }
  codePathState = CodePathState;
  return codePathState;
}

var idGenerator;
var hasRequiredIdGenerator;
function requireIdGenerator() {
  if (hasRequiredIdGenerator) return idGenerator;
  hasRequiredIdGenerator = 1;

  /* eslint-disable react-internal/safe-string-coercion */

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * A generator for unique ids.
   */
  class IdGenerator {
    /**
     * @param {string} prefix Optional. A prefix of generated ids.
     */
    constructor(prefix) {
      this.prefix = String(prefix);
      this.n = 0;
    }

    /**
     * Generates id.
     * @returns {string} A generated id.
     */
    next() {
      this.n = 1 + this.n | 0;

      /* c8 ignore start */
      if (this.n < 0) {
        this.n = 1;
      } /* c8 ignore stop */

      return this.prefix + this.n;
    }
  }
  idGenerator = IdGenerator;
  return idGenerator;
}

var codePath;
var hasRequiredCodePath;
function requireCodePath() {
  if (hasRequiredCodePath) return codePath;
  hasRequiredCodePath = 1;

  //------------------------------------------------------------------------------
  // Requirements
  //------------------------------------------------------------------------------

  // eslint-disable-next-line
  const CodePathState = requireCodePathState();
  // eslint-disable-next-line
  const IdGenerator = requireIdGenerator();

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * A code path.
   */
  class CodePath {
    /**
     * Creates a new instance.
     * @param {Object} options Options for the function (see below).
     * @param {string} options.id An identifier.
     * @param {string} options.origin The type of code path origin.
     * @param {CodePath|null} options.upper The code path of the upper function scope.
     * @param {Function} options.onLooped A callback function to notify looping.
     */
    constructor(_ref) {
      let id = _ref.id,
        origin = _ref.origin,
        upper = _ref.upper,
        onLooped = _ref.onLooped;
      /**
       * The identifier of this code path.
       * Rules use it to store additional information of each rule.
       * @type {string}
       */
      this.id = id;

      /**
       * The reason that this code path was started. May be "program",
       * "function", "class-field-initializer", or "class-static-block".
       * @type {string}
       */
      this.origin = origin;

      /**
       * The code path of the upper function scope.
       * @type {CodePath|null}
       */
      this.upper = upper;

      /**
       * The code paths of nested function scopes.
       * @type {CodePath[]}
       */
      this.childCodePaths = [];

      // Initializes internal state.
      Object.defineProperty(this, 'internal', {
        value: new CodePathState(new IdGenerator(id + "_"), onLooped)
      });

      // Adds this into `childCodePaths` of `upper`.
      if (upper) {
        upper.childCodePaths.push(this);
      }
    }

    /**
     * Gets the state of a given code path.
     * @param {CodePath} codePath A code path to get.
     * @returns {CodePathState} The state of the code path.
     */
    static getState(codePath) {
      return codePath.internal;
    }

    /**
     * The initial code path segment.
     * @type {CodePathSegment}
     */
    get initialSegment() {
      return this.internal.initialSegment;
    }

    /**
     * Final code path segments.
     * This array is a mix of `returnedSegments` and `thrownSegments`.
     * @type {CodePathSegment[]}
     */
    get finalSegments() {
      return this.internal.finalSegments;
    }

    /**
     * Final code path segments which is with `return` statements.
     * This array contains the last path segment if it's reachable.
     * Since the reachable last path returns `undefined`.
     * @type {CodePathSegment[]}
     */
    get returnedSegments() {
      return this.internal.returnedForkContext;
    }

    /**
     * Final code path segments which is with `throw` statements.
     * @type {CodePathSegment[]}
     */
    get thrownSegments() {
      return this.internal.thrownForkContext;
    }

    /**
     * Current code path segments.
     * @type {CodePathSegment[]}
     */
    get currentSegments() {
      return this.internal.currentSegments;
    }

    /**
     * Traverses all segments in this code path.
     *
     *     codePath.traverseSegments(function(segment, controller) {
     *         // do something.
     *     });
     *
     * This method enumerates segments in order from the head.
     *
     * The `controller` object has two methods.
     *
     * - `controller.skip()` - Skip the following segments in this branch.
     * - `controller.break()` - Skip all following segments.
     * @param {Object} [options] Omittable.
     * @param {CodePathSegment} [options.first] The first segment to traverse.
     * @param {CodePathSegment} [options.last] The last segment to traverse.
     * @param {Function} callback A callback function.
     * @returns {void}
     */
    traverseSegments(options, callback) {
      let resolvedOptions;
      let resolvedCallback;
      if (typeof options === 'function') {
        resolvedCallback = options;
        resolvedOptions = {};
      } else {
        resolvedOptions = options || {};
        resolvedCallback = callback;
      }
      const startSegment = resolvedOptions.first || this.internal.initialSegment;
      const lastSegment = resolvedOptions.last;
      let item = null;
      let index = 0;
      let end = 0;
      let segment = null;
      const visited = Object.create(null);
      const stack = [[startSegment, 0]];
      let skippedSegment = null;
      let broken = false;
      const controller = {
        skip() {
          if (stack.length <= 1) {
            broken = true;
          } else {
            skippedSegment = stack[stack.length - 2][0];
          }
        },
        break() {
          broken = true;
        }
      };

      /**
       * Checks a given previous segment has been visited.
       * @param {CodePathSegment} prevSegment A previous segment to check.
       * @returns {boolean} `true` if the segment has been visited.
       */
      function isVisited(prevSegment) {
        return visited[prevSegment.id] || segment.isLoopedPrevSegment(prevSegment);
      }
      while (stack.length > 0) {
        item = stack[stack.length - 1];
        segment = item[0];
        index = item[1];
        if (index === 0) {
          // Skip if this segment has been visited already.
          if (visited[segment.id]) {
            stack.pop();
            continue;
          }

          // Skip if all previous segments have not been visited.
          if (segment !== startSegment && segment.prevSegments.length > 0 && !segment.prevSegments.every(isVisited)) {
            stack.pop();
            continue;
          }

          // Reset the flag of skipping if all branches have been skipped.
          if (skippedSegment && segment.prevSegments.includes(skippedSegment)) {
            skippedSegment = null;
          }
          visited[segment.id] = true;

          // Call the callback when the first time.
          if (!skippedSegment) {
            resolvedCallback.call(this, segment, controller);
            if (segment === lastSegment) {
              controller.skip();
            }
            if (broken) {
              break;
            }
          }
        }

        // Update the stack.
        end = segment.nextSegments.length - 1;
        if (index < end) {
          item[1] += 1;
          stack.push([segment.nextSegments[index], 0]);
        } else if (index === end) {
          item[0] = segment.nextSegments[index];
          item[1] = 0;
        } else {
          stack.pop();
        }
      }
    }
  }
  codePath = CodePath;
  return codePath;
}

var codePathAnalyzer;
var hasRequiredCodePathAnalyzer;
function requireCodePathAnalyzer() {
  if (hasRequiredCodePathAnalyzer) return codePathAnalyzer;
  hasRequiredCodePathAnalyzer = 1;

  /* eslint-disable react-internal/no-primitive-constructors */

  //------------------------------------------------------------------------------
  // Requirements
  //------------------------------------------------------------------------------

  // eslint-disable-next-line
  const assert = requireAssert();
  // eslint-disable-next-line
  const CodePath = requireCodePath();
  // eslint-disable-next-line
  const CodePathSegment = requireCodePathSegment();
  // eslint-disable-next-line
  const IdGenerator = requireIdGenerator();
  const breakableTypePattern = /^(?:(?:Do)?While|For(?:In|Of)?|Switch)Statement$/u;

  //------------------------------------------------------------------------------
  // Helpers
  //------------------------------------------------------------------------------

  /**
   * Checks whether or not a given node is a `case` node (not `default` node).
   * @param {ASTNode} node A `SwitchCase` node to check.
   * @returns {boolean} `true` if the node is a `case` node (not `default` node).
   */
  function isCaseNode(node) {
    return Boolean(node.test);
  }

  /**
   * Checks if a given node appears as the value of a PropertyDefinition node.
   * @param {ASTNode} node THe node to check.
   * @returns {boolean} `true` if the node is a PropertyDefinition value,
   *      false if not.
   */
  function isPropertyDefinitionValue(node) {
    const parent = node.parent;
    return parent && parent.type === 'PropertyDefinition' && parent.value === node;
  }

  /**
   * Checks whether the given logical operator is taken into account for the code
   * path analysis.
   * @param {string} operator The operator found in the LogicalExpression node
   * @returns {boolean} `true` if the operator is "&&" or "||" or "??"
   */
  function isHandledLogicalOperator(operator) {
    return operator === '&&' || operator === '||' || operator === '??';
  }

  /**
   * Checks whether the given assignment operator is a logical assignment operator.
   * Logical assignments are taken into account for the code path analysis
   * because of their short-circuiting semantics.
   * @param {string} operator The operator found in the AssignmentExpression node
   * @returns {boolean} `true` if the operator is "&&=" or "||=" or "??="
   */
  function isLogicalAssignmentOperator(operator) {
    return operator === '&&=' || operator === '||=' || operator === '??=';
  }

  /**
   * Gets the label if the parent node of a given node is a LabeledStatement.
   * @param {ASTNode} node A node to get.
   * @returns {string|null} The label or `null`.
   */
  function getLabel(node) {
    if (node.parent.type === 'LabeledStatement') {
      return node.parent.label.name;
    }
    return null;
  }

  /**
   * Checks whether or not a given logical expression node goes different path
   * between the `true` case and the `false` case.
   * @param {ASTNode} node A node to check.
   * @returns {boolean} `true` if the node is a test of a choice statement.
   */
  function isForkingByTrueOrFalse(node) {
    const parent = node.parent;
    switch (parent.type) {
      case 'ConditionalExpression':
      case 'IfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
        return parent.test === node;
      case 'LogicalExpression':
        return isHandledLogicalOperator(parent.operator);
      case 'AssignmentExpression':
        return isLogicalAssignmentOperator(parent.operator);
      default:
        return false;
    }
  }

  /**
   * Gets the boolean value of a given literal node.
   *
   * This is used to detect infinity loops (e.g. `while (true) {}`).
   * Statements preceded by an infinity loop are unreachable if the loop didn't
   * have any `break` statement.
   * @param {ASTNode} node A node to get.
   * @returns {boolean|undefined} a boolean value if the node is a Literal node,
   *   otherwise `undefined`.
   */
  function getBooleanValueIfSimpleConstant(node) {
    if (node.type === 'Literal') {
      return Boolean(node.value);
    }
    return void 0;
  }

  /**
   * Checks that a given identifier node is a reference or not.
   *
   * This is used to detect the first throwable node in a `try` block.
   * @param {ASTNode} node An Identifier node to check.
   * @returns {boolean} `true` if the node is a reference.
   */
  function isIdentifierReference(node) {
    const parent = node.parent;
    switch (parent.type) {
      case 'LabeledStatement':
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'ArrayPattern':
      case 'RestElement':
      case 'ImportSpecifier':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
      case 'CatchClause':
        return false;
      case 'FunctionDeclaration':
      case 'ComponentDeclaration':
      case 'HookDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'ClassDeclaration':
      case 'ClassExpression':
      case 'VariableDeclarator':
        return parent.id !== node;
      case 'Property':
      case 'PropertyDefinition':
      case 'MethodDefinition':
        return parent.key !== node || parent.computed || parent.shorthand;
      case 'AssignmentPattern':
        return parent.key !== node;
      default:
        return true;
    }
  }

  /**
   * Updates the current segment with the head segment.
   * This is similar to local branches and tracking branches of git.
   *
   * To separate the current and the head is in order to not make useless segments.
   *
   * In this process, both "onCodePathSegmentStart" and "onCodePathSegmentEnd"
   * events are fired.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function forwardCurrentToHead(analyzer, node) {
    const codePath = analyzer.codePath;
    const state = CodePath.getState(codePath);
    const currentSegments = state.currentSegments;
    const headSegments = state.headSegments;
    const end = Math.max(currentSegments.length, headSegments.length);
    let i, currentSegment, headSegment;

    // Fires leaving events.
    for (i = 0; i < end; ++i) {
      currentSegment = currentSegments[i];
      headSegment = headSegments[i];
      if (currentSegment !== headSegment && currentSegment) {
        if (currentSegment.reachable) {
          analyzer.emitter.emit('onCodePathSegmentEnd', currentSegment, node);
        }
      }
    }

    // Update state.
    state.currentSegments = headSegments;

    // Fires entering events.
    for (i = 0; i < end; ++i) {
      currentSegment = currentSegments[i];
      headSegment = headSegments[i];
      if (currentSegment !== headSegment && headSegment) {
        CodePathSegment.markUsed(headSegment);
        if (headSegment.reachable) {
          analyzer.emitter.emit('onCodePathSegmentStart', headSegment, node);
        }
      }
    }
  }

  /**
   * Updates the current segment with empty.
   * This is called at the last of functions or the program.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function leaveFromCurrentSegment(analyzer, node) {
    const state = CodePath.getState(analyzer.codePath);
    const currentSegments = state.currentSegments;
    for (let i = 0; i < currentSegments.length; ++i) {
      const currentSegment = currentSegments[i];
      if (currentSegment.reachable) {
        analyzer.emitter.emit('onCodePathSegmentEnd', currentSegment, node);
      }
    }
    state.currentSegments = [];
  }

  /**
   * Updates the code path due to the position of a given node in the parent node
   * thereof.
   *
   * For example, if the node is `parent.consequent`, this creates a fork from the
   * current path.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function preprocess(analyzer, node) {
    const codePath = analyzer.codePath;
    const state = CodePath.getState(codePath);
    const parent = node.parent;
    switch (parent.type) {
      // The `arguments.length == 0` case is in `postprocess` function.
      case 'CallExpression':
        if (parent.optional === true && parent.arguments.length >= 1 && parent.arguments[0] === node) {
          state.makeOptionalRight();
        }
        break;
      case 'MemberExpression':
        if (parent.optional === true && parent.property === node) {
          state.makeOptionalRight();
        }
        break;
      case 'LogicalExpression':
        if (parent.right === node && isHandledLogicalOperator(parent.operator)) {
          state.makeLogicalRight();
        }
        break;
      case 'AssignmentExpression':
        if (parent.right === node && isLogicalAssignmentOperator(parent.operator)) {
          state.makeLogicalRight();
        }
        break;
      case 'ConditionalExpression':
      case 'IfStatement':
        /*
         * Fork if this node is at `consequent`/`alternate`.
         * `popForkContext()` exists at `IfStatement:exit` and
         * `ConditionalExpression:exit`.
         */
        if (parent.consequent === node) {
          state.makeIfConsequent();
        } else if (parent.alternate === node) {
          state.makeIfAlternate();
        }
        break;
      case 'SwitchCase':
        if (parent.consequent[0] === node) {
          state.makeSwitchCaseBody(false, !parent.test);
        }
        break;
      case 'TryStatement':
        if (parent.handler === node) {
          state.makeCatchBlock();
        } else if (parent.finalizer === node) {
          state.makeFinallyBlock();
        }
        break;
      case 'WhileStatement':
        if (parent.test === node) {
          state.makeWhileTest(getBooleanValueIfSimpleConstant(node));
        } else {
          assert(parent.body === node);
          state.makeWhileBody();
        }
        break;
      case 'DoWhileStatement':
        if (parent.body === node) {
          state.makeDoWhileBody();
        } else {
          assert(parent.test === node);
          state.makeDoWhileTest(getBooleanValueIfSimpleConstant(node));
        }
        break;
      case 'ForStatement':
        if (parent.test === node) {
          state.makeForTest(getBooleanValueIfSimpleConstant(node));
        } else if (parent.update === node) {
          state.makeForUpdate();
        } else if (parent.body === node) {
          state.makeForBody();
        }
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        if (parent.left === node) {
          state.makeForInOfLeft();
        } else if (parent.right === node) {
          state.makeForInOfRight();
        } else {
          assert(parent.body === node);
          state.makeForInOfBody();
        }
        break;
      case 'AssignmentPattern':
        /*
         * Fork if this node is at `right`.
         * `left` is executed always, so it uses the current path.
         * `popForkContext()` exists at `AssignmentPattern:exit`.
         */
        if (parent.right === node) {
          state.pushForkContext();
          state.forkBypassPath();
          state.forkPath();
        }
        break;
    }
  }

  /**
   * Updates the code path due to the type of a given node in entering.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function processCodePathToEnter(analyzer, node) {
    let codePath = analyzer.codePath;
    let state = codePath && CodePath.getState(codePath);
    const parent = node.parent;

    /**
     * Creates a new code path and trigger the onCodePathStart event
     * based on the currently selected node.
     * @param {string} origin The reason the code path was started.
     * @returns {void}
     */
    function startCodePath(origin) {
      if (codePath) {
        // Emits onCodePathSegmentStart events if updated.
        forwardCurrentToHead(analyzer, node);
      }

      // Create the code path of this scope.
      codePath = analyzer.codePath = new CodePath({
        id: analyzer.idGenerator.next(),
        origin,
        upper: codePath,
        onLooped: analyzer.onLooped
      });
      state = CodePath.getState(codePath);

      // Emits onCodePathStart events.
      analyzer.emitter.emit('onCodePathStart', codePath, node);
    }

    /*
     * Special case: The right side of class field initializer is considered
     * to be its own function, so we need to start a new code path in this
     * case.
     */
    if (isPropertyDefinitionValue(node)) {
      startCodePath('class-field-initializer');

      /*
       * Intentional fall through because `node` needs to also be
       * processed by the code below. For example, if we have:
       *
       * class Foo {
       *     a = () => {}
       * }
       *
       * In this case, we also need start a second code path.
       */
    }
    switch (node.type) {
      case 'Program':
        startCodePath('program');
        break;
      case 'FunctionDeclaration':
      case 'ComponentDeclaration':
      case 'HookDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        startCodePath('function');
        break;
      case 'StaticBlock':
        startCodePath('class-static-block');
        break;
      case 'ChainExpression':
        state.pushChainContext();
        break;
      case 'CallExpression':
        if (node.optional === true) {
          state.makeOptionalNode();
        }
        break;
      case 'MemberExpression':
        if (node.optional === true) {
          state.makeOptionalNode();
        }
        break;
      case 'LogicalExpression':
        if (isHandledLogicalOperator(node.operator)) {
          state.pushChoiceContext(node.operator, isForkingByTrueOrFalse(node));
        }
        break;
      case 'AssignmentExpression':
        if (isLogicalAssignmentOperator(node.operator)) {
          state.pushChoiceContext(node.operator.slice(0, -1),
          // removes `=` from the end
          isForkingByTrueOrFalse(node));
        }
        break;
      case 'ConditionalExpression':
      case 'IfStatement':
        state.pushChoiceContext('test', false);
        break;
      case 'SwitchStatement':
        state.pushSwitchContext(node.cases.some(isCaseNode), getLabel(node));
        break;
      case 'TryStatement':
        state.pushTryContext(Boolean(node.finalizer));
        break;
      case 'SwitchCase':
        /*
         * Fork if this node is after the 2st node in `cases`.
         * It's similar to `else` blocks.
         * The next `test` node is processed in this path.
         */
        if (parent.discriminant !== node && parent.cases[0] !== node) {
          state.forkPath();
        }
        break;
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        state.pushLoopContext(node.type, getLabel(node));
        break;
      case 'LabeledStatement':
        if (!breakableTypePattern.test(node.body.type)) {
          state.pushBreakContext(false, node.label.name);
        }
        break;
    }

    // Emits onCodePathSegmentStart events if updated.
    forwardCurrentToHead(analyzer, node);
  }

  /**
   * Updates the code path due to the type of a given node in leaving.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function processCodePathToExit(analyzer, node) {
    const codePath = analyzer.codePath;
    const state = CodePath.getState(codePath);
    let dontForward = false;
    switch (node.type) {
      case 'ChainExpression':
        state.popChainContext();
        break;
      case 'IfStatement':
      case 'ConditionalExpression':
        state.popChoiceContext();
        break;
      case 'LogicalExpression':
        if (isHandledLogicalOperator(node.operator)) {
          state.popChoiceContext();
        }
        break;
      case 'AssignmentExpression':
        if (isLogicalAssignmentOperator(node.operator)) {
          state.popChoiceContext();
        }
        break;
      case 'SwitchStatement':
        state.popSwitchContext();
        break;
      case 'SwitchCase':
        /*
         * This is the same as the process at the 1st `consequent` node in
         * `preprocess` function.
         * Must do if this `consequent` is empty.
         */
        if (node.consequent.length === 0) {
          state.makeSwitchCaseBody(true, !node.test);
        }
        if (state.forkContext.reachable) {
          dontForward = true;
        }
        break;
      case 'TryStatement':
        state.popTryContext();
        break;
      case 'BreakStatement':
        forwardCurrentToHead(analyzer, node);
        state.makeBreak(node.label && node.label.name);
        dontForward = true;
        break;
      case 'ContinueStatement':
        forwardCurrentToHead(analyzer, node);
        state.makeContinue(node.label && node.label.name);
        dontForward = true;
        break;
      case 'ReturnStatement':
        forwardCurrentToHead(analyzer, node);
        state.makeReturn();
        dontForward = true;
        break;
      case 'ThrowStatement':
        forwardCurrentToHead(analyzer, node);
        state.makeThrow();
        dontForward = true;
        break;
      case 'Identifier':
        if (isIdentifierReference(node)) {
          state.makeFirstThrowablePathInTryBlock();
          dontForward = true;
        }
        break;
      case 'CallExpression':
      case 'ImportExpression':
      case 'MemberExpression':
      case 'NewExpression':
      case 'YieldExpression':
        state.makeFirstThrowablePathInTryBlock();
        break;
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        state.popLoopContext();
        break;
      case 'AssignmentPattern':
        state.popForkContext();
        break;
      case 'LabeledStatement':
        if (!breakableTypePattern.test(node.body.type)) {
          state.popBreakContext();
        }
        break;
    }

    // Emits onCodePathSegmentStart events if updated.
    if (!dontForward) {
      forwardCurrentToHead(analyzer, node);
    }
  }

  /**
   * Updates the code path to finalize the current code path.
   * @param {CodePathAnalyzer} analyzer The instance.
   * @param {ASTNode} node The current AST node.
   * @returns {void}
   */
  function postprocess(analyzer, node) {
    /**
     * Ends the code path for the current node.
     * @returns {void}
     */
    function endCodePath() {
      let codePath = analyzer.codePath;

      // Mark the current path as the final node.
      CodePath.getState(codePath).makeFinal();

      // Emits onCodePathSegmentEnd event of the current segments.
      leaveFromCurrentSegment(analyzer, node);

      // Emits onCodePathEnd event of this code path.
      analyzer.emitter.emit('onCodePathEnd', codePath, node);
      codePath = analyzer.codePath = analyzer.codePath.upper;
    }
    switch (node.type) {
      case 'Program':
      case 'FunctionDeclaration':
      case 'ComponentDeclaration':
      case 'HookDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'StaticBlock':
        {
          endCodePath();
          break;
        }

      // The `arguments.length >= 1` case is in `preprocess` function.
      case 'CallExpression':
        if (node.optional === true && node.arguments.length === 0) {
          CodePath.getState(analyzer.codePath).makeOptionalRight();
        }
        break;
    }

    /*
     * Special case: The right side of class field initializer is considered
     * to be its own function, so we need to end a code path in this
     * case.
     *
     * We need to check after the other checks in order to close the
     * code paths in the correct order for code like this:
     *
     *
     * class Foo {
     *     a = () => {}
     * }
     *
     * In this case, The ArrowFunctionExpression code path is closed first
     * and then we need to close the code path for the PropertyDefinition
     * value.
     */
    if (isPropertyDefinitionValue(node)) {
      endCodePath();
    }
  }

  //------------------------------------------------------------------------------
  // Public Interface
  //------------------------------------------------------------------------------

  /**
   * The class to analyze code paths.
   * This class implements the EventGenerator interface.
   */
  class CodePathAnalyzer {
    /**
     * @param {EventGenerator} eventGenerator An event generator to wrap.
     */
    constructor(emitters) {
      this.emitter = {
        emit(event) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          emitters[event]?.(...args);
        }
      };
      this.codePath = null;
      this.idGenerator = new IdGenerator('s');
      this.currentNode = null;
      this.onLooped = this.onLooped.bind(this);
    }

    /**
     * Does the process to enter a given AST node.
     * This updates state of analysis and calls `enterNode` of the wrapped.
     * @param {ASTNode} node A node which is entering.
     * @returns {void}
     */
    enterNode(node) {
      this.currentNode = node;

      // Updates the code path due to node's position in its parent node.
      if (node.parent) {
        preprocess(this, node);
      }

      /*
       * Updates the code path.
       * And emits onCodePathStart/onCodePathSegmentStart events.
       */
      processCodePathToEnter(this, node);
      this.currentNode = null;
    }

    /**
     * Does the process to leave a given AST node.
     * This updates state of analysis and calls `leaveNode` of the wrapped.
     * @param {ASTNode} node A node which is leaving.
     * @returns {void}
     */
    leaveNode(node) {
      this.currentNode = node;

      /*
       * Updates the code path.
       * And emits onCodePathStart/onCodePathSegmentStart events.
       */
      processCodePathToExit(this, node);

      // Emits the last onCodePathStart/onCodePathSegmentStart events.
      postprocess(this, node);
      this.currentNode = null;
    }

    /**
     * This is called on a code path looped.
     * Then this raises a looped event.
     * @param {CodePathSegment} fromSegment A segment of prev.
     * @param {CodePathSegment} toSegment A segment of next.
     * @returns {void}
     */
    onLooped(fromSegment, toSegment) {
      if (fromSegment.reachable && toSegment.reachable) {
        this.emitter.emit('onCodePathSegmentLoop', fromSegment, toSegment, this.currentNode);
      }
    }
  }
  codePathAnalyzer = CodePathAnalyzer;
  return codePathAnalyzer;
}

var codePathAnalyzerExports = requireCodePathAnalyzer();
var CodePathAnalyzer = /*@__PURE__*/getDefaultExportFromCjs(codePathAnalyzerExports);

function isHookName(s) {
    return s === 'use' || /^use[A-Z0-9]/.test(s);
}
function isHook(node) {
    if (node.type === 'Identifier') {
        return isHookName(node.name);
    }
    else if (node.type === 'MemberExpression' &&
        !node.computed &&
        isHook(node.property)) {
        const obj = node.object;
        const isPascalCaseNameSpace = /^[A-Z].*/;
        return obj.type === 'Identifier' && isPascalCaseNameSpace.test(obj.name);
    }
    else {
        return false;
    }
}
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
function isForwardRefCallback(node) {
    return !!(node.parent &&
        'callee' in node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, 'forwardRef'));
}
function isMemoCallback(node) {
    return !!(node.parent &&
        'callee' in node.parent &&
        node.parent.callee &&
        isReactFunction(node.parent.callee, 'memo'));
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
function isInsideDoWhileLoop(node) {
    while (node) {
        if (node.type === 'DoWhileStatement') {
            return true;
        }
        node = node.parent;
    }
    return false;
}
function isInsideTryCatch(node) {
    while (node) {
        if (node.type === 'TryStatement' || node.type === 'CatchClause') {
            return true;
        }
        node = node.parent;
    }
    return false;
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
function isEffectIdentifier(node, additionalHooks) {
    const isBuiltInEffect = node.type === 'Identifier' &&
        (node.name === 'useEffect' ||
            node.name === 'useLayoutEffect' ||
            node.name === 'useInsertionEffect');
    if (isBuiltInEffect) {
        return true;
    }
    if (additionalHooks && node.type === 'Identifier') {
        return additionalHooks.test(node.name);
    }
    return false;
}
function isUseEffectEventIdentifier(node) {
    return node.type === 'Identifier' && node.name === 'useEffectEvent';
}
function isUseIdentifier(node) {
    return isReactFunction(node, 'use');
}
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'enforces the Rules of Hooks',
            recommended: true,
            url: 'https://react.dev/reference/rules/rules-of-hooks',
        },
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
        const settings = context.settings || {};
        const additionalEffectHooks = getAdditionalEffectHooksFromSettings(settings);
        let lastEffect = null;
        const codePathReactHooksMapStack = [];
        const codePathSegmentStack = [];
        const useEffectEventFunctions = new WeakSet();
        function recordAllUseEffectEventFunctions(scope) {
            for (const reference of scope.references) {
                const parent = reference.identifier.parent;
                if ((parent === null || parent === void 0 ? void 0 : parent.type) === 'VariableDeclarator' &&
                    parent.init &&
                    parent.init.type === 'CallExpression' &&
                    parent.init.callee &&
                    isUseEffectEventIdentifier(parent.init.callee)) {
                    if (reference.resolved === null) {
                        throw new Error('Unexpected null reference.resolved');
                    }
                    for (const ref of reference.resolved.references) {
                        if (ref !== reference) {
                            useEffectEventFunctions.add(ref.identifier);
                        }
                    }
                }
            }
        }
        const getSourceCode = typeof context.getSourceCode === 'function'
            ? () => {
                return context.getSourceCode();
            }
            : () => {
                return context.sourceCode;
            };
        const getScope = typeof context.getScope === 'function'
            ? () => {
                return context.getScope();
            }
            : (node) => {
                return getSourceCode().getScope(node);
            };
        function hasFlowSuppression(node, suppression) {
            const sourceCode = getSourceCode();
            const comments = sourceCode.getAllComments();
            const flowSuppressionRegex = new RegExp('\\$FlowFixMe\\[' + suppression + '\\]');
            return comments.some(commentNode => flowSuppressionRegex.test(commentNode.value) &&
                commentNode.loc != null &&
                node.loc != null &&
                commentNode.loc.end.line === node.loc.start.line - 1);
        }
        const analyzer = new CodePathAnalyzer({
            onCodePathSegmentStart: (segment) => codePathSegmentStack.push(segment),
            onCodePathSegmentEnd: () => codePathSegmentStack.pop(),
            onCodePathStart: () => codePathReactHooksMapStack.push(new Map()),
            onCodePathEnd(codePath, codePathNode) {
                const reactHooksMap = codePathReactHooksMapStack.pop();
                if ((reactHooksMap === null || reactHooksMap === void 0 ? void 0 : reactHooksMap.size) === 0) {
                    return;
                }
                else if (typeof reactHooksMap === 'undefined') {
                    throw new Error('Unexpected undefined reactHooksMap');
                }
                const cyclic = new Set();
                function countPathsFromStart(segment, pathHistory) {
                    const { cache } = countPathsFromStart;
                    let paths = cache.get(segment.id);
                    const pathList = new Set(pathHistory);
                    if (pathList.has(segment.id)) {
                        const pathArray = [...pathList];
                        const cyclicSegments = pathArray.slice(pathArray.indexOf(segment.id) + 1);
                        for (const cyclicSegment of cyclicSegments) {
                            cyclic.add(cyclicSegment);
                        }
                        return BigInt('0');
                    }
                    pathList.add(segment.id);
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
                        for (const prevSegment of segment.prevSegments) {
                            paths += countPathsFromStart(prevSegment, pathList);
                        }
                    }
                    if (segment.reachable && paths === BigInt('0')) {
                        cache.delete(segment.id);
                    }
                    else {
                        cache.set(segment.id, paths);
                    }
                    return paths;
                }
                function countPathsToEnd(segment, pathHistory) {
                    const { cache } = countPathsToEnd;
                    let paths = cache.get(segment.id);
                    const pathList = new Set(pathHistory);
                    if (pathList.has(segment.id)) {
                        const pathArray = Array.from(pathList);
                        const cyclicSegments = pathArray.slice(pathArray.indexOf(segment.id) + 1);
                        for (const cyclicSegment of cyclicSegments) {
                            cyclic.add(cyclicSegment);
                        }
                        return BigInt('0');
                    }
                    pathList.add(segment.id);
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
                        for (const nextSegment of segment.nextSegments) {
                            paths += countPathsToEnd(nextSegment, pathList);
                        }
                    }
                    cache.set(segment.id, paths);
                    return paths;
                }
                function shortestPathLengthToStart(segment) {
                    const { cache } = shortestPathLengthToStart;
                    let length = cache.get(segment.id);
                    if (length === null) {
                        return Infinity;
                    }
                    if (length !== undefined) {
                        return length;
                    }
                    cache.set(segment.id, null);
                    if (segment.prevSegments.length === 0) {
                        length = 1;
                    }
                    else {
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
                const allPathsFromStartToEnd = countPathsToEnd(codePath.initialSegment);
                const codePathFunctionName = getFunctionName(codePathNode);
                const isSomewhereInsideComponentOrHook = isInsideComponentOrHook(codePathNode);
                const isDirectlyInsideComponentOrHook = codePathFunctionName
                    ? isComponentName(codePathFunctionName) ||
                        isHook(codePathFunctionName)
                    : isForwardRefCallback(codePathNode) || isMemoCallback(codePathNode);
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
                for (const [segment, reactHooks] of reactHooksMap) {
                    if (!segment.reachable) {
                        continue;
                    }
                    const possiblyHasEarlyReturn = segment.nextSegments.length === 0
                        ? shortestFinalPathLength <= shortestPathLengthToStart(segment)
                        : shortestFinalPathLength < shortestPathLengthToStart(segment);
                    const pathsFromStartToEnd = countPathsFromStart(segment) * countPathsToEnd(segment);
                    const cycled = cyclic.has(segment.id);
                    for (const hook of reactHooks) {
                        if (hasFlowSuppression(hook, 'react-rule-hook')) {
                            continue;
                        }
                        if (isUseIdentifier(hook) && isInsideTryCatch(hook)) {
                            context.report({
                                node: hook,
                                message: `React Hook "${getSourceCode().getText(hook)}" cannot be called in a try/catch block.`,
                            });
                        }
                        if ((cycled || isInsideDoWhileLoop(hook)) &&
                            !isUseIdentifier(hook)) {
                            context.report({
                                node: hook,
                                message: `React Hook "${getSourceCode().getText(hook)}" may be executed ` +
                                    'more than once. Possibly because it is called in a loop. ' +
                                    'React Hooks must be called in the exact same order in ' +
                                    'every component render.',
                            });
                        }
                        if (isDirectlyInsideComponentOrHook) {
                            const isAsyncFunction = codePathNode.async;
                            if (isAsyncFunction) {
                                context.report({
                                    node: hook,
                                    message: `React Hook "${getSourceCode().getText(hook)}" cannot be ` +
                                        'called in an async function.',
                                });
                            }
                            if (!cycled &&
                                pathsFromStartToEnd !== allPathsFromStartToEnd &&
                                !isUseIdentifier(hook) &&
                                !isInsideDoWhileLoop(hook)) {
                                const message = `React Hook "${getSourceCode().getText(hook)}" is called ` +
                                    'conditionally. React Hooks must be called in the exact ' +
                                    'same order in every component render.' +
                                    (possiblyHasEarlyReturn
                                        ? ' Did you accidentally call a React Hook after an' +
                                            ' early return?'
                                        : '');
                                context.report({ node: hook, message });
                            }
                        }
                        else if (codePathNode.parent != null &&
                            (codePathNode.parent.type === 'MethodDefinition' ||
                                codePathNode.parent.type === 'ClassProperty' ||
                                codePathNode.parent.type === 'PropertyDefinition') &&
                            codePathNode.parent.value === codePathNode) {
                            const message = `React Hook "${getSourceCode().getText(hook)}" cannot be called ` +
                                'in a class component. React Hooks must be called in a ' +
                                'React function component or a custom React Hook function.';
                            context.report({ node: hook, message });
                        }
                        else if (codePathFunctionName) {
                            const message = `React Hook "${getSourceCode().getText(hook)}" is called in ` +
                                `function "${getSourceCode().getText(codePathFunctionName)}" ` +
                                'that is neither a React function component nor a custom ' +
                                'React Hook function.' +
                                ' React component names must start with an uppercase letter.' +
                                ' React Hook names must start with the word "use".';
                            context.report({ node: hook, message });
                        }
                        else if (codePathNode.type === 'Program') {
                            const message = `React Hook "${getSourceCode().getText(hook)}" cannot be called ` +
                                'at the top level. React Hooks must be called in a ' +
                                'React function component or a custom React Hook function.';
                            context.report({ node: hook, message });
                        }
                        else {
                            if (isSomewhereInsideComponentOrHook && !isUseIdentifier(hook)) {
                                const message = `React Hook "${getSourceCode().getText(hook)}" cannot be called ` +
                                    'inside a callback. React Hooks must be called in a ' +
                                    'React function component or a custom React Hook function.';
                                context.report({ node: hook, message });
                            }
                        }
                    }
                }
            },
        });
        return {
            '*'(node) {
                analyzer.enterNode(node);
            },
            '*:exit'(node) {
                analyzer.leaveNode(node);
            },
            CallExpression(node) {
                if (isHook(node.callee)) {
                    const reactHooksMap = last(codePathReactHooksMapStack);
                    const codePathSegment = last(codePathSegmentStack);
                    let reactHooks = reactHooksMap.get(codePathSegment);
                    if (!reactHooks) {
                        reactHooks = [];
                        reactHooksMap.set(codePathSegment, reactHooks);
                    }
                    reactHooks.push(node.callee);
                }
                const nodeWithoutNamespace = getNodeWithoutReactNamespace(node.callee);
                if ((isEffectIdentifier(nodeWithoutNamespace, additionalEffectHooks) ||
                    isUseEffectEventIdentifier(nodeWithoutNamespace)) &&
                    node.arguments.length > 0) {
                    lastEffect = node;
                }
            },
            Identifier(node) {
                if (lastEffect == null && useEffectEventFunctions.has(node)) {
                    const message = `\`${getSourceCode().getText(node)}\` is a function created with React Hook "useEffectEvent", and can only be called from ` +
                        'the same component.' +
                        (node.parent.type === 'CallExpression'
                            ? ''
                            : ' They cannot be assigned to variables or passed down.');
                    context.report({
                        node,
                        message,
                    });
                }
            },
            'CallExpression:exit'(node) {
                if (node === lastEffect) {
                    lastEffect = null;
                }
            },
            FunctionDeclaration(node) {
                if (isInsideComponentOrHook(node)) {
                    recordAllUseEffectEventFunctions(getScope(node));
                }
            },
            ArrowFunctionExpression(node) {
                if (isInsideComponentOrHook(node)) {
                    recordAllUseEffectEventFunctions(getScope(node));
                }
            },
        };
    },
};
function getFunctionName(node) {
    var _a, _b, _c, _d;
    if (node.type === 'ComponentDeclaration' ||
        node.type === 'HookDeclaration' ||
        node.type === 'FunctionDeclaration' ||
        (node.type === 'FunctionExpression' && node.id)) {
        return node.id;
    }
    else if (node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {
        if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === 'VariableDeclarator' &&
            node.parent.init === node) {
            return node.parent.id;
        }
        else if (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.type) === 'AssignmentExpression' &&
            node.parent.right === node &&
            node.parent.operator === '=') {
            return node.parent.left;
        }
        else if (((_c = node.parent) === null || _c === void 0 ? void 0 : _c.type) === 'Property' &&
            node.parent.value === node &&
            !node.parent.computed) {
            return node.parent.key;
        }
        else if (((_d = node.parent) === null || _d === void 0 ? void 0 : _d.type) === 'AssignmentPattern' &&
            node.parent.right === node &&
            !node.parent.computed) {
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
function last(array) {
    return array[array.length - 1];
}

const rules = {
    'exhaustive-deps': rule$1,
    'rules-of-hooks': rule,
};
const ruleConfigs = {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
};
const plugin = {
    meta: {
        name: 'eslint-plugin-react-hooks',
    },
    configs: {},
    rules,
};
Object.assign(plugin.configs, {
    'recommended-legacy': {
        plugins: ['react-hooks'],
        rules: ruleConfigs,
    },
    'flat/recommended': [
        {
            plugins: {
                'react-hooks': plugin,
            },
            rules: ruleConfigs,
        },
    ],
    'recommended-latest': [
        {
            plugins: {
                'react-hooks': plugin,
            },
            rules: ruleConfigs,
        },
    ],
    recommended: {
        plugins: ['react-hooks'],
        rules: ruleConfigs,
    },
});

module.exports = plugin;
