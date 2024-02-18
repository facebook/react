/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from "../CompilerError";
import {
  ExternalFunction,
  parseEnvironmentConfig,
  tryParseExternalFunction,
} from "../HIR/Environment";
import { CodegenFunction } from "../ReactiveScopes";
import { isComponentDeclaration } from "../Utils/ComponentDeclaration";
import { isHookDeclaration } from "../Utils/HookDeclaration";
import { assertExhaustive } from "../Utils/utils";
import { insertGatedFunctionDeclaration } from "./Gating";
import { addImportsToProgram, updateUseMemoCacheImport } from "./Imports";
import { PluginOptions, parsePluginOptions } from "./Options";
import { compileFn } from "./Pipeline";
import {
  filterSuppressionsThatAffectFunction,
  findProgramSuppressions,
  suppressionsToCompilerError,
} from "./Suppression";

export type CompilerPass = {
  opts: PluginOptions;
  filename: string | null;
  comments: (t.CommentBlock | t.CommentLine)[];
};

function findDirectiveEnablingMemoization(
  directives: t.Directive[]
): t.Directive | null {
  for (const directive of directives) {
    const directiveValue = directive.value.value;
    if (directiveValue === "use forget" || directiveValue === "use memo") {
      return directive;
    }
  }
  return null;
}

function findDirectiveDisablingMemoization(
  directives: t.Directive[]
): t.Directive | null {
  for (const directive of directives) {
    const directiveValue = directive.value.value;
    if (
      directiveValue === "use no forget" ||
      directiveValue === "use no memo"
    ) {
      return directive;
    }
  }
  return null;
}

function isCriticalError(err: unknown): boolean {
  return !(err instanceof CompilerError) || err.isCritical();
}

function isConfigError(err: unknown): boolean {
  if (err instanceof CompilerError) {
    return err.details.some(
      (detail) => detail.severity === ErrorSeverity.InvalidConfig
    );
  }
  return false;
}

export type BabelFn =
  | NodePath<t.FunctionDeclaration>
  | NodePath<t.FunctionExpression>
  | NodePath<t.ArrowFunctionExpression>;

export type CompileResult = {
  originalFn: BabelFn;
  compiledFn: CodegenFunction;
};

function handleError(
  err: unknown,
  pass: CompilerPass,
  fnLoc: t.SourceLocation | null
): void {
  if (pass.opts.logger) {
    if (err instanceof CompilerError) {
      for (const detail of err.details) {
        pass.opts.logger.logEvent(pass.filename, {
          kind: "CompileError",
          fnLoc,
          detail: detail.options,
        });
      }
    } else {
      let stringifiedError;
      if (err instanceof Error) {
        stringifiedError = err.stack ?? err.message;
      } else {
        stringifiedError = err?.toString() ?? "[ null ]";
      }

      pass.opts.logger.logEvent(pass.filename, {
        kind: "PipelineError",
        fnLoc,
        data: stringifiedError,
      });
    }
  }
  if (
    pass.opts.panicThreshold === "ALL_ERRORS" ||
    (pass.opts.panicThreshold === "CRITICAL_ERRORS" && isCriticalError(err)) ||
    isConfigError(err) // Always throws regardless of panic threshold
  ) {
    throw err;
  }
}

export function createNewFunctionNode(
  originalFn: BabelFn,
  compiledFn: CodegenFunction
): t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression {
  let transformedFn:
    | t.FunctionDeclaration
    | t.ArrowFunctionExpression
    | t.FunctionExpression;
  switch (originalFn.node.type) {
    case "FunctionDeclaration": {
      const fn: t.FunctionDeclaration = {
        type: "FunctionDeclaration",
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
    case "ArrowFunctionExpression": {
      const fn: t.ArrowFunctionExpression = {
        type: "ArrowFunctionExpression",
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
    case "FunctionExpression": {
      const fn: t.FunctionExpression = {
        type: "FunctionExpression",
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
  }

  // Avoid visiting the new transformed version
  ALREADY_COMPILED.add(transformedFn);
  return transformedFn;
}

/*
 * This is a hack to work around what seems to be a Babel bug. Babel doesn't
 * consistently respect the `skip()` function to avoid revisiting a node within
 * a pass, so we use this set to track nodes that we have compiled.
 */
const ALREADY_COMPILED: WeakSet<object> | Set<object> = new (WeakSet ?? Set)();

const DEFAULT_ESLINT_SUPPRESSIONS = [
  "react-hooks/exhaustive-deps",
  "react-hooks/rules-of-hooks",
];

export function compileProgram(
  program: NodePath<t.Program>,
  pass: CompilerPass
): void {
  // Top level "use no forget", skip this file entirely
  if (findDirectiveDisablingMemoization(program.node.directives) != null) {
    return;
  }

  const options = parsePluginOptions(pass.opts);
  const environment = parseEnvironmentConfig(pass.opts.environment ?? {});

  /*
   * Record lint errors and critical errors as depending on Forget's config,
   * we may still need to run Forget's analysis on every function (even if we
   * have already encountered errors) for reporting.
   */
  const suppressions = findProgramSuppressions(
    pass.comments,
    options.eslintSuppressionRules ?? DEFAULT_ESLINT_SUPPRESSIONS,
    options.flowSuppressions
  );
  const lintError = suppressionsToCompilerError(suppressions);
  let hasCriticalError = lintError != null;
  const compiledFns: CompileResult[] = [];

  const traverseFunction = (fn: BabelFn, pass: CompilerPass): void => {
    if (!shouldVisitNode(fn, pass) || ALREADY_COMPILED.has(fn.node)) {
      return;
    }

    /*
     * We may be generating a new FunctionDeclaration node, so we must skip over it or this
     * traversal will loop infinitely.
     * Ensure we avoid visiting the original function again.
     */
    ALREADY_COMPILED.add(fn.node);
    fn.skip();

    if (lintError != null) {
      /**
       * Note that Babel does not attach comment nodes to nodes; they are dangling off of the
       * Program node itself. We need to figure out whether an eslint suppression range
       * applies to this function first.
       */
      const suppressionsInFunction = filterSuppressionsThatAffectFunction(
        suppressions,
        fn
      );
      if (suppressionsInFunction.length > 0) {
        handleError(lintError, pass, fn.node.loc ?? null);
      }
    }

    let compiledFn: CodegenFunction;
    try {
      /*
       * TODO(lauren): Remove pass.opts.environment nullcheck once PluginOptions
       * is validated
       */
      const config = environment.unwrap();

      compiledFn = compileFn(fn, config);
      pass.opts.logger?.logEvent(pass.filename, {
        kind: "CompileSuccess",
        fnLoc: fn.node.loc ?? null,
        fnName: compiledFn.id?.name ?? null,
        memoSlots: compiledFn.memoSlotsUsed,
        memoBlocks: compiledFn.memoBlocks,
      });
    } catch (err) {
      hasCriticalError ||= isCriticalError(err);
      handleError(err, pass, fn.node.loc ?? null);
      return;
    }

    if (!pass.opts.noEmit && !hasCriticalError) {
      compiledFns.push({ originalFn: fn, compiledFn });
    }
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
      opts: { ...pass.opts, ...options },
      filename: pass.filename ?? null,
    }
  );

  if (options.gating != null) {
    const error = checkFunctionReferencedBeforeDeclarationAtTopLevel(
      program,
      compiledFns.map(({ originalFn }) => originalFn)
    );
    if (error) {
      handleError(error, pass, null);
      return;
    }
  }

  const externalFunctions: ExternalFunction[] = [];
  let instrumentForget: null | ExternalFunction = null;
  let gating: null | ExternalFunction = null;
  try {
    // TODO: check for duplicate import specifiers
    if (options.gating != null) {
      gating = tryParseExternalFunction(options.gating);
      externalFunctions.push(gating);
    }

    if (options.environment?.enableEmitInstrumentForget != null) {
      instrumentForget = tryParseExternalFunction(
        options.environment.enableEmitInstrumentForget
      );
      externalFunctions.push(instrumentForget);
    }

    if (options.environment?.enableEmitFreeze != null) {
      const enableEmitFreeze = tryParseExternalFunction(
        options.environment.enableEmitFreeze
      );
      externalFunctions.push(enableEmitFreeze);
    }

    if (options.environment?.enableEmitHookGuards != null) {
      const enableEmitHookGuards = tryParseExternalFunction(
        options.environment.enableEmitHookGuards
      );
      externalFunctions.push(enableEmitHookGuards);
    }
  } catch (err) {
    handleError(err, pass, null);
    return;
  }

  /*
   * Only insert Forget-ified functions if we have not encountered a critical
   * error elsewhere in the file, regardless of bailout mode.
   */
  for (const { originalFn, compiledFn } of compiledFns) {
    const transformedFn = createNewFunctionNode(originalFn, compiledFn);

    if (gating != null) {
      insertGatedFunctionDeclaration(originalFn, transformedFn, gating);
    } else {
      originalFn.replaceWith(transformedFn);
    }
  }

  // Forget compiled the component, we need to update existing imports of unstable_useMemoCache
  if (compiledFns.length > 0) {
    updateUseMemoCacheImport(program, options);
    addImportsToProgram(program, externalFunctions);
  }
}

function shouldVisitNode(fn: BabelFn, pass: CompilerPass): boolean {
  if (hasUseMemoCacheCall(fn)) {
    return false;
  }
  if (fn.node.body.type === "BlockStatement") {
    // Opt-outs disable compilation regardless of mode
    const useNoForget = findDirectiveDisablingMemoization(
      fn.node.body.directives
    );
    if (useNoForget != null) {
      pass.opts.logger?.logEvent(pass.filename, {
        kind: "CompileError",
        fnLoc: fn.node.body.loc ?? null,
        detail: {
          severity: ErrorSeverity.Todo,
          reason: 'Skipped due to "use no forget" directive.',
          loc: useNoForget.loc ?? null,
          suggestions: null,
        },
      });
      return false;
    }
    // Otherwise opt-ins enable compilation regardless of mode
    if (findDirectiveEnablingMemoization(fn.node.body.directives) != null) {
      return true;
    }
  }
  switch (pass.opts.compilationMode) {
    case "annotation": {
      // opt-ins are checked above
      return false;
    }
    case "infer": {
      const hookPattern = pass.opts.environment?.hookPattern ?? null;
      return (
        // Component and hook declarations are known components/hooks
        (fn.isFunctionDeclaration() &&
          (isComponentDeclaration(fn.node) || isHookDeclaration(fn.node))) ||
        // Otherwise check if this is a component or hook-like function
        isComponentOrHookLike(fn, hookPattern)
      );
    }
    case "all": {
      return fn.scope.getProgramParent() === fn.scope.parent;
    }
    default: {
      assertExhaustive(
        pass.opts.compilationMode,
        `Unexpected compilationMode '${pass.opts.compilationMode}'`
      );
    }
  }
}

function hasUseMemoCacheCall(
  fn: NodePath<
    t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression
  >
): boolean {
  let hasUseMemoCache = false;
  fn.traverse({
    Identifier(path) {
      if (
        path.node.name === "useMemoCache" ||
        path.node.name === "unstable_useMemoCache"
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
  hookPattern: string | null
): boolean {
  if (path.isIdentifier()) {
    return isHookName(path.node.name, hookPattern);
  } else if (
    path.isMemberExpression() &&
    !path.node.computed &&
    isHook(path.get("property"), hookPattern)
  ) {
    const obj = path.get("object").node;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === "Identifier" && isPascalCaseNameSpace.test(obj.name);
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
  functionName: string
): boolean {
  const node = path.node;
  return (
    (node.type === "Identifier" && node.name === functionName) ||
    (node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === "React" &&
      node.property.type === "Identifier" &&
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
    path.parentPath.get("callee").isExpression() &&
    isReactAPI(path.parentPath.get("callee"), "forwardRef")
  );
}

/*
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(path: NodePath<t.Expression>): boolean {
  return (
    path.parentPath.isCallExpression() &&
    path.parentPath.get("callee").isExpression() &&
    isReactAPI(path.parentPath.get("callee"), "memo")
  );
}

function isValidComponentParams(
  params: Array<NodePath<t.Identifier | t.Pattern | t.RestElement>>
): boolean {
  if (params.length === 0) {
    return true;
  } else if (params.length === 1) {
    return !params[0].isRestElement();
  } else if (params.length === 2) {
    // check if second param might be a ref
    if (params[1].isIdentifier()) {
      const { name } = params[1].node;
      return name.includes("ref") || name.includes("Ref");
    }
    /**
     * Otherwise, avoid helper functions that take more than one argument.
     * Helpers are _usually_ named with lowercase, but some code may
     * violate this rule
     */
  }
  return false;
}

/*
 * Adapted from the ESLint rule at
 * https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js#L90-L103
 */
function isComponentOrHookLike(
  node: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  hookPattern: string | null
): boolean {
  const functionName = getFunctionName(node);
  // Check if the name is component or hook like:
  if (functionName !== null && isComponentName(functionName)) {
    return (
      // As an added check we also look for hook invocations or JSX
      callsHooksOrCreatesJsx(node, hookPattern) &&
      isValidComponentParams(node.get("params"))
    );
  } else if (functionName !== null && isHook(functionName, hookPattern)) {
    // Hooks have hook invocations or JSX, but can take any # of arguments
    return callsHooksOrCreatesJsx(node, hookPattern);
  }

  /*
   * Otherwise for function or arrow function expressions, check if they
   * appear as the argument to React.forwardRef() or React.memo():
   */
  if (node.isFunctionExpression() || node.isArrowFunctionExpression()) {
    if (isForwardRefCallback(node) || isMemoCallback(node)) {
      // As an added check we also look for hook invocations or JSX
      return callsHooksOrCreatesJsx(node, hookPattern);
    } else {
      return false;
    }
  }
  return false;
}

function callsHooksOrCreatesJsx(
  node: NodePath<t.Node>,
  hookPattern: string | null
): boolean {
  let invokesHooks = false;
  let createsJsx = false;
  node.traverse({
    JSX() {
      createsJsx = true;
    },
    CallExpression(call) {
      const callee = call.get("callee");
      if (callee.isExpression() && isHook(callee, hookPattern)) {
        invokesHooks = true;
      }
    },
  });

  return invokesHooks || createsJsx;
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
  >
): NodePath<t.Expression> | null {
  if (path.isFunctionDeclaration()) {
    const id = path.get("id");
    if (id.isIdentifier()) {
      return id;
    }
    return null;
  }
  let id: NodePath<t.LVal | t.Expression | t.PrivateName> | null = null;
  const parent = path.parentPath;
  if (parent.isVariableDeclarator() && parent.get("init").node === path.node) {
    // const useHook = () => {};
    id = parent.get("id");
  } else if (
    parent.isAssignmentExpression() &&
    parent.get("right").node === path.node &&
    parent.get("operator") === "="
  ) {
    // useHook = () => {};
    id = parent.get("left");
  } else if (
    parent.isProperty() &&
    parent.get("value").node === path.node &&
    !parent.get("computed") &&
    parent.get("key").isLVal()
  ) {
    /*
     * {useHook: () => {}}
     * {useHook() {}}
     */
    id = parent.get("key");
  } else if (
    parent.isAssignmentPattern() &&
    parent.get("right").node === path.node &&
    !parent.get("computed")
  ) {
    /*
     * const {useHook = () => {}} = {};
     * ({useHook = () => {}} = {});
     *
     * Kinda clowny, but we'd said we'd follow spec convention for
     * `IsAnonymousFunctionDefinition()` usage.
     */
    id = parent.get("left");
  }
  if (id !== null && (id.isIdentifier() || id.isMemberExpression())) {
    return id;
  } else {
    return null;
  }
}

function checkFunctionReferencedBeforeDeclarationAtTopLevel(
  program: NodePath<t.Program>,
  fns: BabelFn[]
): CompilerError | null {
  const fnIds = new Set(
    fns
      .map((fn) => getFunctionName(fn))
      .filter(
        (name): name is NodePath<t.Identifier> => !!name && name.isIdentifier()
      )
      .map((name) => name.node)
  );
  const fnNames = new Map([...fnIds].map((id) => [id.name, id]));
  const errors = new CompilerError();

  program.traverse({
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
          })
        );
      }
    },
  });

  return errors.details.length > 0 ? errors : null;
}
