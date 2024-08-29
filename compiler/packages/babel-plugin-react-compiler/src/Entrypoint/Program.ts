/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';
import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from '../CompilerError';
import {
  EnvironmentConfig,
  ExternalFunction,
  ReactFunctionType,
  tryParseExternalFunction,
} from '../HIR/Environment';
import {CodegenFunction} from '../ReactiveScopes';
import {isComponentDeclaration} from '../Utils/ComponentDeclaration';
import {isHookDeclaration} from '../Utils/HookDeclaration';
import {assertExhaustive} from '../Utils/utils';
import {insertGatedFunctionDeclaration} from './Gating';
import {
  addImportsToProgram,
  updateMemoCacheFunctionImport,
  validateRestrictedImports,
} from './Imports';
import {PluginOptions} from './Options';
import {compileFn} from './Pipeline';
import {
  filterSuppressionsThatAffectFunction,
  findProgramSuppressions,
  suppressionsToCompilerError,
} from './Suppression';

export type CompilerPass = {
  opts: PluginOptions;
  filename: string | null;
  comments: Array<t.CommentBlock | t.CommentLine>;
  code: string | null;
};
const OPT_IN_DIRECTIVES = new Set(['use forget', 'use memo']);
export const OPT_OUT_DIRECTIVES = new Set(['use no forget', 'use no memo']);

function findDirectiveEnablingMemoization(
  directives: Array<t.Directive>,
): Array<t.Directive> {
  return directives.filter(directive =>
    OPT_IN_DIRECTIVES.has(directive.value.value),
  );
}

function findDirectiveDisablingMemoization(
  directives: Array<t.Directive>,
): Array<t.Directive> {
  return directives.filter(directive =>
    OPT_OUT_DIRECTIVES.has(directive.value.value),
  );
}

function isCriticalError(err: unknown): boolean {
  return !(err instanceof CompilerError) || err.isCritical();
}

function isConfigError(err: unknown): boolean {
  if (err instanceof CompilerError) {
    return err.details.some(
      detail => detail.severity === ErrorSeverity.InvalidConfig,
    );
  }
  return false;
}

export type BabelFn =
  | NodePath<t.FunctionDeclaration>
  | NodePath<t.FunctionExpression>
  | NodePath<t.ArrowFunctionExpression>;

export type CompileResult = {
  /**
   * Distinguishes existing functions that were compiled ('original') from
   * functions which were outlined. Only original functions need to be gated
   * if gating mode is enabled.
   */
  kind: 'original' | 'outlined';
  originalFn: BabelFn;
  compiledFn: CodegenFunction;
};

function logError(
  err: unknown,
  pass: CompilerPass,
  fnLoc: t.SourceLocation | null,
): void {
  if (pass.opts.logger) {
    if (err instanceof CompilerError) {
      for (const detail of err.details) {
        pass.opts.logger.logEvent(pass.filename, {
          kind: 'CompileError',
          fnLoc,
          detail: detail.options,
        });
      }
    } else {
      let stringifiedError;
      if (err instanceof Error) {
        stringifiedError = err.stack ?? err.message;
      } else {
        stringifiedError = err?.toString() ?? '[ null ]';
      }

      pass.opts.logger.logEvent(pass.filename, {
        kind: 'PipelineError',
        fnLoc,
        data: stringifiedError,
      });
    }
  }
}
function handleError(
  err: unknown,
  pass: CompilerPass,
  fnLoc: t.SourceLocation | null,
): void {
  logError(err, pass, fnLoc);
  if (
    pass.opts.panicThreshold === 'all_errors' ||
    (pass.opts.panicThreshold === 'critical_errors' && isCriticalError(err)) ||
    isConfigError(err) // Always throws regardless of panic threshold
  ) {
    throw err;
  }
}

export function createNewFunctionNode(
  originalFn: BabelFn,
  compiledFn: CodegenFunction,
): t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression {
  let transformedFn:
    | t.FunctionDeclaration
    | t.ArrowFunctionExpression
    | t.FunctionExpression;
  switch (originalFn.node.type) {
    case 'FunctionDeclaration': {
      const fn: t.FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: compiledFn.id,
        loc: originalFn.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        body: compiledFn.body,
      };
      transformedFn = fn;
      break;
    }
    case 'ArrowFunctionExpression': {
      const fn: t.ArrowFunctionExpression = {
        type: 'ArrowFunctionExpression',
        loc: originalFn.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        expression: originalFn.node.expression,
        body: compiledFn.body,
      };
      transformedFn = fn;
      break;
    }
    case 'FunctionExpression': {
      const fn: t.FunctionExpression = {
        type: 'FunctionExpression',
        id: compiledFn.id,
        loc: originalFn.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        body: compiledFn.body,
      };
      transformedFn = fn;
      break;
    }
    default: {
      assertExhaustive(
        originalFn.node,
        `Creating unhandled function: ${originalFn.node}`,
      );
    }
  }
  // Avoid visiting the new transformed version
  ALREADY_COMPILED.add(transformedFn);
  return transformedFn;
}

function insertNewOutlinedFunctionNode(
  program: NodePath<t.Program>,
  originalFn: BabelFn,
  compiledFn: CodegenFunction,
): NodePath<t.Function> {
  switch (originalFn.type) {
    case 'FunctionDeclaration': {
      return originalFn.insertAfter(
        createNewFunctionNode(originalFn, compiledFn),
      )[0]!;
    }
    /**
     * We can't just append the outlined function as a sibling of the original function if it is an
     * (Arrow)FunctionExpression parented by a VariableDeclaration, as this would cause its parent
     * to become a SequenceExpression instead which breaks a bunch of assumptions elsewhere in the
     * plugin.
     *
     * To get around this, we always synthesize a new FunctionDeclaration for the outlined function
     * and insert it as a true sibling to the original function.
     */
    case 'ArrowFunctionExpression':
    case 'FunctionExpression': {
      const fn: t.FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: compiledFn.id,
        loc: originalFn.node.loc ?? null,
        async: compiledFn.async,
        generator: compiledFn.generator,
        params: compiledFn.params,
        body: compiledFn.body,
      };
      const insertedFuncDecl = program.pushContainer('body', [fn])[0]!;
      CompilerError.invariant(insertedFuncDecl.isFunctionDeclaration(), {
        reason: 'Expected inserted function declaration',
        description: `Got: ${insertedFuncDecl}`,
        loc: insertedFuncDecl.node?.loc ?? null,
      });
      return insertedFuncDecl;
    }
    default: {
      assertExhaustive(
        originalFn,
        `Inserting unhandled function: ${originalFn}`,
      );
    }
  }
}

/*
 * This is a hack to work around what seems to be a Babel bug. Babel doesn't
 * consistently respect the `skip()` function to avoid revisiting a node within
 * a pass, so we use this set to track nodes that we have compiled.
 */
const ALREADY_COMPILED: WeakSet<object> | Set<object> = new (WeakSet ?? Set)();

const DEFAULT_ESLINT_SUPPRESSIONS = [
  'react-hooks/exhaustive-deps',
  'react-hooks/rules-of-hooks',
];

function isFilePartOfSources(
  sources: Array<string> | ((filename: string) => boolean),
  filename: string,
): boolean {
  if (typeof sources === 'function') {
    return sources(filename);
  }

  for (const prefix of sources) {
    if (filename.indexOf(prefix) !== -1) {
      return true;
    }
  }

  return false;
}

/**
 * `compileProgram` is directly invoked by the react-compiler babel plugin, so
 * exceptions thrown by this function will fail the babel build.
 * - call `handleError` if your error is recoverable.
 *   Unless the error is a warning / info diagnostic, compilation of a function
 *   / entire file should also be skipped.
 * - throw an exception if the error is fatal / not recoverable.
 *   Examples of this are invalid compiler configs or failure to codegen outlined
 *   functions *after* already emitting optimized components / hooks that invoke
 *   the outlined functions.
 */
export function compileProgram(
  program: NodePath<t.Program>,
  pass: CompilerPass,
): void {
  if (shouldSkipCompilation(program, pass)) {
    return;
  }

  const environment = pass.opts.environment;
  const restrictedImportsErr = validateRestrictedImports(program, environment);
  if (restrictedImportsErr) {
    handleError(restrictedImportsErr, pass, null);
    return;
  }
  const useMemoCacheIdentifier = program.scope.generateUidIdentifier('c');
  const moduleName = pass.opts.runtimeModule ?? 'react/compiler-runtime';

  /*
   * Record lint errors and critical errors as depending on Forget's config,
   * we may still need to run Forget's analysis on every function (even if we
   * have already encountered errors) for reporting.
   */
  const suppressions = findProgramSuppressions(
    pass.comments,
    pass.opts.eslintSuppressionRules ?? DEFAULT_ESLINT_SUPPRESSIONS,
    pass.opts.flowSuppressions,
  );
  const lintError = suppressionsToCompilerError(suppressions);
  let hasCriticalError = lintError != null;
  const queue: Array<{
    kind: 'original' | 'outlined';
    fn: BabelFn;
    fnType: ReactFunctionType;
  }> = [];
  const compiledFns: Array<CompileResult> = [];

  const traverseFunction = (fn: BabelFn, pass: CompilerPass): void => {
    const fnType = getReactFunctionType(fn, pass, environment);
    if (fnType === null || ALREADY_COMPILED.has(fn.node)) {
      return;
    }

    /*
     * We may be generating a new FunctionDeclaration node, so we must skip over it or this
     * traversal will loop infinitely.
     * Ensure we avoid visiting the original function again.
     */
    ALREADY_COMPILED.add(fn.node);
    fn.skip();

    queue.push({kind: 'original', fn, fnType});
  };

  // Main traversal to compile with Forget
  program.traverse(
    {
      ClassDeclaration(node: NodePath<t.ClassDeclaration>) {
        /*
         * Don't visit functions defined inside classes, because they
         * can reference `this` which is unsafe for compilation
         */
        node.skip();
        return;
      },

      ClassExpression(node: NodePath<t.ClassExpression>) {
        /*
         * Don't visit functions defined inside classes, because they
         * can reference `this` which is unsafe for compilation
         */
        node.skip();
        return;
      },

      FunctionDeclaration: traverseFunction,

      FunctionExpression: traverseFunction,

      ArrowFunctionExpression: traverseFunction,
    },
    {
      ...pass,
      opts: {...pass.opts, ...pass.opts},
      filename: pass.filename ?? null,
    },
  );

  const processFn = (
    fn: BabelFn,
    fnType: ReactFunctionType,
  ): null | CodegenFunction => {
    let optInDirectives: Array<t.Directive> = [];
    let optOutDirectives: Array<t.Directive> = [];
    if (fn.node.body.type === 'BlockStatement') {
      optInDirectives = findDirectiveEnablingMemoization(
        fn.node.body.directives,
      );
      optOutDirectives = findDirectiveDisablingMemoization(
        fn.node.body.directives,
      );
    }

    if (lintError != null) {
      /**
       * Note that Babel does not attach comment nodes to nodes; they are dangling off of the
       * Program node itself. We need to figure out whether an eslint suppression range
       * applies to this function first.
       */
      const suppressionsInFunction = filterSuppressionsThatAffectFunction(
        suppressions,
        fn,
      );
      if (suppressionsInFunction.length > 0) {
        if (optOutDirectives.length > 0) {
          logError(lintError, pass, fn.node.loc ?? null);
        } else {
          handleError(lintError, pass, fn.node.loc ?? null);
        }
      }
    }

    let compiledFn: CodegenFunction;
    try {
      compiledFn = compileFn(
        fn,
        environment,
        fnType,
        useMemoCacheIdentifier.name,
        pass.opts.logger,
        pass.filename,
        pass.code,
      );
      pass.opts.logger?.logEvent(pass.filename, {
        kind: 'CompileSuccess',
        fnLoc: fn.node.loc ?? null,
        fnName: compiledFn.id?.name ?? null,
        memoSlots: compiledFn.memoSlotsUsed,
        memoBlocks: compiledFn.memoBlocks,
        memoValues: compiledFn.memoValues,
        prunedMemoBlocks: compiledFn.prunedMemoBlocks,
        prunedMemoValues: compiledFn.prunedMemoValues,
      });
    } catch (err) {
      /**
       * If an opt out directive is present, log only instead of throwing and don't mark as
       * containing a critical error.
       */
      if (fn.node.body.type === 'BlockStatement') {
        if (optOutDirectives.length > 0) {
          logError(err, pass, fn.node.loc ?? null);
          return null;
        }
      }
      hasCriticalError ||= isCriticalError(err);
      handleError(err, pass, fn.node.loc ?? null);
      return null;
    }

    /**
     * Always compile functions with opt in directives.
     */
    if (optInDirectives.length > 0) {
      return compiledFn;
    } else if (pass.opts.compilationMode === 'annotation') {
      /**
       * No opt-in directive in annotation mode, so don't insert the compiled function.
       */
      return null;
    }

    /**
     * Otherwise if 'use no forget/memo' is present, we still run the code through the compiler
     * for validation but we don't mutate the babel AST. This allows us to flag if there is an
     * unused 'use no forget/memo' directive.
     */
    if (pass.opts.ignoreUseNoForget === false && optOutDirectives.length > 0) {
      for (const directive of optOutDirectives) {
        pass.opts.logger?.logEvent(pass.filename, {
          kind: 'CompileSkip',
          fnLoc: fn.node.body.loc ?? null,
          reason: `Skipped due to '${directive.value.value}' directive.`,
          loc: directive.loc ?? null,
        });
      }
      return null;
    }

    if (!pass.opts.noEmit && !hasCriticalError) {
      return compiledFn;
    }
    return null;
  };

  while (queue.length !== 0) {
    const current = queue.shift()!;
    const compiled = processFn(current.fn, current.fnType);
    if (compiled === null) {
      continue;
    }
    for (const outlined of compiled.outlined) {
      CompilerError.invariant(outlined.fn.outlined.length === 0, {
        reason: 'Unexpected nested outlined functions',
        loc: outlined.fn.loc,
      });
      const fn = insertNewOutlinedFunctionNode(
        program,
        current.fn,
        outlined.fn,
      );
      fn.skip();
      ALREADY_COMPILED.add(fn.node);
      if (outlined.type !== null) {
        CompilerError.throwTodo({
          reason: `Implement support for outlining React functions (components/hooks)`,
          loc: outlined.fn.loc,
        });
        /*
         * Above should be as simple as the following, but needs testing:
         * queue.push({
         *   kind: "outlined",
         *   fn,
         *   fnType: outlined.type,
         * });
         */
      }
    }
    compiledFns.push({
      kind: current.kind,
      compiledFn: compiled,
      originalFn: current.fn,
    });
  }

  /**
   * Do not modify source if there is a module scope level opt out directive.
   */
  const moduleScopeOptOutDirectives = findDirectiveDisablingMemoization(
    program.node.directives,
  );
  if (moduleScopeOptOutDirectives.length > 0) {
    return;
  }

  if (pass.opts.gating != null) {
    const error = checkFunctionReferencedBeforeDeclarationAtTopLevel(
      program,
      compiledFns.map(result => {
        return result.originalFn;
      }),
    );
    if (error) {
      handleError(error, pass, null);
      return;
    }
  }

  const hasLoweredContextAccess = compiledFns.some(
    c => c.compiledFn.hasLoweredContextAccess,
  );
  const externalFunctions: Array<ExternalFunction> = [];
  let gating: null | ExternalFunction = null;
  try {
    // TODO: check for duplicate import specifiers
    if (pass.opts.gating != null) {
      gating = tryParseExternalFunction(pass.opts.gating);
      externalFunctions.push(gating);
    }

    const lowerContextAccess = environment.lowerContextAccess;
    if (lowerContextAccess && hasLoweredContextAccess) {
      externalFunctions.push(lowerContextAccess);
    }

    const enableEmitInstrumentForget = environment.enableEmitInstrumentForget;
    if (enableEmitInstrumentForget != null) {
      externalFunctions.push(enableEmitInstrumentForget.fn);
      if (enableEmitInstrumentForget.gating != null) {
        externalFunctions.push(enableEmitInstrumentForget.gating);
      }
    }

    if (environment.enableEmitFreeze != null) {
      externalFunctions.push(environment.enableEmitFreeze);
    }

    if (environment.enableEmitHookGuards != null) {
      externalFunctions.push(environment.enableEmitHookGuards);
    }

    if (environment.enableChangeDetectionForDebugging != null) {
      externalFunctions.push(environment.enableChangeDetectionForDebugging);
    }
  } catch (err) {
    handleError(err, pass, null);
    return;
  }

  /*
   * Only insert Forget-ified functions if we have not encountered a critical
   * error elsewhere in the file, regardless of bailout mode.
   */
  for (const result of compiledFns) {
    const {kind, originalFn, compiledFn} = result;
    const transformedFn = createNewFunctionNode(originalFn, compiledFn);

    if (gating != null && kind === 'original') {
      insertGatedFunctionDeclaration(originalFn, transformedFn, gating);
    } else {
      originalFn.replaceWith(transformedFn);
    }
  }

  // Forget compiled the component, we need to update existing imports of useMemoCache
  if (compiledFns.length > 0) {
    let needsMemoCacheFunctionImport = false;
    for (const fn of compiledFns) {
      if (fn.compiledFn.memoSlotsUsed > 0) {
        needsMemoCacheFunctionImport = true;
        break;
      }
    }

    if (needsMemoCacheFunctionImport) {
      updateMemoCacheFunctionImport(
        program,
        moduleName,
        useMemoCacheIdentifier.name,
      );
    }
    addImportsToProgram(program, externalFunctions);
  }
}

function shouldSkipCompilation(
  program: NodePath<t.Program>,
  pass: CompilerPass,
): boolean {
  if (pass.opts.sources) {
    if (pass.filename === null) {
      const error = new CompilerError();
      error.pushErrorDetail(
        new CompilerErrorDetail({
          reason: `Expected a filename but found none.`,
          description:
            "When the 'sources' config options is specified, the React compiler will only compile files with a name",
          severity: ErrorSeverity.InvalidConfig,
          loc: null,
        }),
      );
      handleError(error, pass, null);
      return true;
    }

    if (!isFilePartOfSources(pass.opts.sources, pass.filename)) {
      return true;
    }
  }

  const moduleName = pass.opts.runtimeModule ?? 'react/compiler-runtime';
  if (hasMemoCacheFunctionImport(program, moduleName)) {
    return true;
  }
  return false;
}

function getReactFunctionType(
  fn: BabelFn,
  pass: CompilerPass,
  /**
   * TODO(mofeiZ): remove once we validate PluginOptions with Zod
   */
  environment: EnvironmentConfig,
): ReactFunctionType | null {
  const hookPattern = environment.hookPattern;
  if (fn.node.body.type === 'BlockStatement') {
    if (findDirectiveEnablingMemoization(fn.node.body.directives).length > 0)
      return getComponentOrHookLike(fn, hookPattern) ?? 'Other';
  }

  // Component and hook declarations are known components/hooks
  let componentSyntaxType: ReactFunctionType | null = null;
  if (fn.isFunctionDeclaration()) {
    if (isComponentDeclaration(fn.node)) {
      componentSyntaxType = 'Component';
    } else if (isHookDeclaration(fn.node)) {
      componentSyntaxType = 'Hook';
    }
  }

  switch (pass.opts.compilationMode) {
    case 'annotation': {
      // opt-ins are checked above
      return null;
    }
    case 'infer': {
      // Check if this is a component or hook-like function
      return componentSyntaxType ?? getComponentOrHookLike(fn, hookPattern);
    }
    case 'syntax': {
      return componentSyntaxType;
    }
    case 'all': {
      // Compile only top level functions
      if (fn.scope.getProgramParent() !== fn.scope.parent) {
        return null;
      }

      return getComponentOrHookLike(fn, hookPattern) ?? 'Other';
    }
    default: {
      assertExhaustive(
        pass.opts.compilationMode,
        `Unexpected compilationMode \`${pass.opts.compilationMode}\``,
      );
    }
  }
}

/**
 * Returns true if the program contains an `import {c} from "<moduleName>"` declaration,
 * regardless of the local name of the 'c' specifier and the presence of other specifiers
 * in the same declaration.
 */
function hasMemoCacheFunctionImport(
  program: NodePath<t.Program>,
  moduleName: string,
): boolean {
  let hasUseMemoCache = false;
  program.traverse({
    ImportSpecifier(path) {
      const imported = path.get('imported');
      let importedName: string | null = null;
      if (imported.isIdentifier()) {
        importedName = imported.node.name;
      } else if (imported.isStringLiteral()) {
        importedName = imported.node.value;
      }
      if (
        importedName === 'c' &&
        path.parentPath.isImportDeclaration() &&
        path.parentPath.get('source').node.value === moduleName
      ) {
        hasUseMemoCache = true;
      }
    },
  });
  return hasUseMemoCache;
}

function isHookName(s: string, hookPattern: string | null): boolean {
  if (hookPattern !== null) {
    return new RegExp(hookPattern).test(s);
  }
  return /^use[A-Z0-9]/.test(s);
}

/*
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */

function isHook(
  path: NodePath<t.Expression | t.PrivateName>,
  hookPattern: string | null,
): boolean {
  if (path.isIdentifier()) {
    return isHookName(path.node.name, hookPattern);
  } else if (
    path.isMemberExpression() &&
    !path.node.computed &&
    isHook(path.get('property'), hookPattern)
  ) {
    const obj = path.get('object').node;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === 'Identifier' && isPascalCaseNameSpace.test(obj.name);
  } else {
    return false;
  }
}

/*
 * Checks if the node is a React component name. React component names must
 * always start with an uppercase letter.
 */

function isComponentName(path: NodePath<t.Expression>): boolean {
  return path.isIdentifier() && /^[A-Z]/.test(path.node.name);
}

function isReactAPI(
  path: NodePath<t.Expression | t.PrivateName | t.V8IntrinsicIdentifier>,
  functionName: string,
): boolean {
  const node = path.node;
  return (
    (node.type === 'Identifier' && node.name === functionName) ||
    (node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      node.object.name === 'React' &&
      node.property.type === 'Identifier' &&
      node.property.name === functionName)
  );
}

/*
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */

function isForwardRefCallback(path: NodePath<t.Expression>): boolean {
  return !!(
    path.parentPath.isCallExpression() &&
    path.parentPath.get('callee').isExpression() &&
    isReactAPI(path.parentPath.get('callee'), 'forwardRef')
  );
}

/*
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(path: NodePath<t.Expression>): boolean {
  return (
    path.parentPath.isCallExpression() &&
    path.parentPath.get('callee').isExpression() &&
    isReactAPI(path.parentPath.get('callee'), 'memo')
  );
}

function isValidPropsAnnotation(
  annot: t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | null | undefined,
): boolean {
  if (annot == null) {
    return true;
  } else if (annot.type === 'TSTypeAnnotation') {
    switch (annot.typeAnnotation.type) {
      case 'TSArrayType':
      case 'TSBigIntKeyword':
      case 'TSBooleanKeyword':
      case 'TSConstructorType':
      case 'TSFunctionType':
      case 'TSLiteralType':
      case 'TSNeverKeyword':
      case 'TSNumberKeyword':
      case 'TSStringKeyword':
      case 'TSSymbolKeyword':
      case 'TSTupleType':
        return false;
    }
    return true;
  } else if (annot.type === 'TypeAnnotation') {
    switch (annot.typeAnnotation.type) {
      case 'ArrayTypeAnnotation':
      case 'BooleanLiteralTypeAnnotation':
      case 'BooleanTypeAnnotation':
      case 'EmptyTypeAnnotation':
      case 'FunctionTypeAnnotation':
      case 'NumberLiteralTypeAnnotation':
      case 'NumberTypeAnnotation':
      case 'StringLiteralTypeAnnotation':
      case 'StringTypeAnnotation':
      case 'SymbolTypeAnnotation':
      case 'ThisTypeAnnotation':
      case 'TupleTypeAnnotation':
        return false;
    }
    return true;
  } else if (annot.type === 'Noop') {
    return true;
  } else {
    assertExhaustive(annot, `Unexpected annotation node \`${annot}\``);
  }
}

function isValidComponentParams(
  params: Array<NodePath<t.Identifier | t.Pattern | t.RestElement>>,
): boolean {
  if (params.length === 0) {
    return true;
  } else if (params.length > 0 && params.length <= 2) {
    if (!isValidPropsAnnotation(params[0].node.typeAnnotation)) {
      return false;
    }

    if (params.length === 1) {
      return !params[0].isRestElement();
    } else if (params[1].isIdentifier()) {
      // check if second param might be a ref
      const {name} = params[1].node;
      return name.includes('ref') || name.includes('Ref');
    } else {
      /**
       * Otherwise, avoid helper functions that take more than one argument.
       * Helpers are _usually_ named with lowercase, but some code may
       * violate this rule
       */
      return false;
    }
  }
  return false;
}

/*
 * Adapted from the ESLint rule at
 * https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js#L90-L103
 */
function getComponentOrHookLike(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  hookPattern: string | null,
): ReactFunctionType | null {
  const functionName = getFunctionName(node);
  // Check if the name is component or hook like:
  if (functionName !== null && isComponentName(functionName)) {
    let isComponent =
      callsHooksOrCreatesJsx(node, hookPattern) &&
      isValidComponentParams(node.get('params')) &&
      !returnsNonNode(node);
    return isComponent ? 'Component' : null;
  } else if (functionName !== null && isHook(functionName, hookPattern)) {
    // Hooks have hook invocations or JSX, but can take any # of arguments
    return callsHooksOrCreatesJsx(node, hookPattern) ? 'Hook' : null;
  }

  /*
   * Otherwise for function or arrow function expressions, check if they
   * appear as the argument to React.forwardRef() or React.memo():
   */
  if (node.isFunctionExpression() || node.isArrowFunctionExpression()) {
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      // As an added check we also look for hook invocations or JSX
      return callsHooksOrCreatesJsx(node, hookPattern) ? 'Component' : null;
    }
  }
  return null;
}

function skipNestedFunctions(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
) {
  return (
    fn: NodePath<
      t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
    >,
  ): void => {
    if (fn.node !== node.node) {
      fn.skip();
    }
  };
}

function callsHooksOrCreatesJsx(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  hookPattern: string | null,
): boolean {
  let invokesHooks = false;
  let createsJsx = false;

  node.traverse({
    JSX() {
      createsJsx = true;
    },
    CallExpression(call) {
      const callee = call.get('callee');
      if (callee.isExpression() && isHook(callee, hookPattern)) {
        invokesHooks = true;
      }
    },
    ArrowFunctionExpression: skipNestedFunctions(node),
    FunctionExpression: skipNestedFunctions(node),
    FunctionDeclaration: skipNestedFunctions(node),
  });

  return invokesHooks || createsJsx;
}

function returnsNonNode(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
): boolean {
  let hasReturn = false;
  let returnsNonNode = false;

  node.traverse({
    ReturnStatement(ret) {
      hasReturn = true;
      const argument = ret.node.argument;
      if (argument == null) {
        returnsNonNode = true;
      } else {
        switch (argument.type) {
          case 'ObjectExpression':
          case 'ArrowFunctionExpression':
          case 'FunctionExpression':
          case 'BigIntLiteral':
          case 'ClassExpression':
          case 'NewExpression': // technically `new Array()` is legit, but unlikely
            returnsNonNode = true;
        }
      }
    },
    ArrowFunctionExpression: skipNestedFunctions(node),
    FunctionExpression: skipNestedFunctions(node),
    FunctionDeclaration: skipNestedFunctions(node),
  });

  return !hasReturn || returnsNonNode;
}

/*
 * Gets the static name of a function AST node. For function declarations it is
 * easy. For anonymous function expressions it is much harder. If you search for
 * `IsAnonymousFunctionDefinition()` in the ECMAScript spec you'll find places
 * where JS gives anonymous function expressions names. We roughly detect the
 * same AST nodes with some exceptions to better fit our use case.
 */

function getFunctionName(
  path: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
): NodePath<t.Expression> | null {
  if (path.isFunctionDeclaration()) {
    const id = path.get('id');
    if (id.isIdentifier()) {
      return id;
    }
    return null;
  }
  let id: NodePath<t.LVal | t.Expression | t.PrivateName> | null = null;
  const parent = path.parentPath;
  if (parent.isVariableDeclarator() && parent.get('init').node === path.node) {
    // const useHook = () => {};
    id = parent.get('id');
  } else if (
    parent.isAssignmentExpression() &&
    parent.get('right').node === path.node &&
    parent.get('operator') === '='
  ) {
    // useHook = () => {};
    id = parent.get('left');
  } else if (
    parent.isProperty() &&
    parent.get('value').node === path.node &&
    !parent.get('computed') &&
    parent.get('key').isLVal()
  ) {
    /*
     * {useHook: () => {}}
     * {useHook() {}}
     */
    id = parent.get('key');
  } else if (
    parent.isAssignmentPattern() &&
    parent.get('right').node === path.node &&
    !parent.get('computed')
  ) {
    /*
     * const {useHook = () => {}} = {};
     * ({useHook = () => {}} = {});
     *
     * Kinda clowny, but we'd said we'd follow spec convention for
     * `IsAnonymousFunctionDefinition()` usage.
     */
    id = parent.get('left');
  }
  if (id !== null && (id.isIdentifier() || id.isMemberExpression())) {
    return id;
  } else {
    return null;
  }
}

function checkFunctionReferencedBeforeDeclarationAtTopLevel(
  program: NodePath<t.Program>,
  fns: Array<BabelFn>,
): CompilerError | null {
  const fnIds = new Set(
    fns
      .map(fn => getFunctionName(fn))
      .filter(
        (name): name is NodePath<t.Identifier> => !!name && name.isIdentifier(),
      )
      .map(name => name.node),
  );
  const fnNames = new Map([...fnIds].map(id => [id.name, id]));
  const errors = new CompilerError();

  program.traverse({
    TypeAnnotation(path) {
      path.skip();
    },
    TSTypeAnnotation(path) {
      path.skip();
    },
    TypeAlias(path) {
      path.skip();
    },
    TSTypeAliasDeclaration(path) {
      path.skip();
    },
    Identifier(id) {
      const fn = fnNames.get(id.node.name);
      // We're not tracking this identifier.
      if (!fn) {
        return;
      }

      /*
       * We've reached the declaration, hoisting is no longer possible, stop
       * checking for this component name.
       */
      if (fnIds.has(id.node)) {
        fnIds.delete(id.node);
        fnNames.delete(id.node.name);
        return;
      }

      const scope = id.scope.getFunctionParent();
      /*
       * A null scope means there's no function scope, which means we're at the
       * top level scope.
       */
      if (scope === null) {
        errors.pushErrorDetail(
          new CompilerErrorDetail({
            reason: `Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting`,
            description: `Rewrite the reference to ${fn.name} to not rely on hoisting to fix this issue`,
            loc: fn.loc ?? null,
            suggestions: null,
            severity: ErrorSeverity.Invariant,
          }),
        );
      }
    },
  });

  return errors.details.length > 0 ? errors : null;
}
