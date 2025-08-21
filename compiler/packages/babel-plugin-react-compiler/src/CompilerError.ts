/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {codeFrameColumns} from '@babel/code-frame';
import type {SourceLocation} from './HIR';
import {Err, Ok, Result} from './Utils/Result';
import {assertExhaustive} from './Utils/utils';

export enum ErrorSeverity {
  /**
   * Invalid JS syntax, or valid syntax that is semantically invalid which may indicate some
   * misunderstanding on the user’s part.
   */
  InvalidJS = 'InvalidJS',
  /**
   * JS syntax that is not supported and which we do not plan to support. Developers should
   * rewrite to use supported forms.
   */
  UnsupportedJS = 'UnsupportedJS',
  /**
   * Code that breaks the rules of React.
   */
  InvalidReact = 'InvalidReact',
  /**
   * Incorrect configuration of the compiler.
   */
  InvalidConfig = 'InvalidConfig',
  /**
   * Code that can reasonably occur and that doesn't break any rules, but is unsafe to preserve
   * memoization.
   */
  CannotPreserveMemoization = 'CannotPreserveMemoization',
  /**
   * Unhandled syntax that we don't support yet.
   */
  Todo = 'Todo',
  /**
   * An unexpected internal error in the compiler that indicates critical issues that can panic
   * the compiler.
   */
  Invariant = 'Invariant',
}

export type CompilerDiagnosticOptions = {
  category: ErrorCategory;
  severity: ErrorSeverity;
  reason: string;
  description: string;
  details: Array<CompilerDiagnosticDetail>;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
};

export type CompilerDiagnosticDetail =
  /**
   * A/the source of the error
   */
  | {
      kind: 'error';
      loc: SourceLocation | null;
      message: string;
    }
  | {
      kind: 'hint';
      message: string;
    };

export enum CompilerSuggestionOperation {
  InsertBefore,
  InsertAfter,
  Remove,
  Replace,
}
export type CompilerSuggestion =
  | {
      op:
        | CompilerSuggestionOperation.InsertAfter
        | CompilerSuggestionOperation.InsertBefore
        | CompilerSuggestionOperation.Replace;
      range: [number, number];
      description: string;
      text: string;
    }
  | {
      op: CompilerSuggestionOperation.Remove;
      range: [number, number];
      description: string;
    };

export type CompilerErrorDetailOptions = {
  category: ErrorCategory;
  severity: ErrorSeverity;
  reason: string;
  description?: string | null | undefined;
  loc: SourceLocation | null;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
};

export type PrintErrorMessageOptions = {
  /**
   * ESLint uses 1-indexed columns and prints one error at a time
   * So it doesn't require the "Found # error(s)" text
   */
  eslint: boolean;
};

export class CompilerDiagnostic {
  options: CompilerDiagnosticOptions;

  constructor(options: CompilerDiagnosticOptions) {
    this.options = options;
  }

  static create(
    options: Omit<CompilerDiagnosticOptions, 'details'>,
  ): CompilerDiagnostic {
    return new CompilerDiagnostic({...options, details: []});
  }

  get reason(): CompilerDiagnosticOptions['reason'] {
    return this.options.reason;
  }
  get description(): CompilerDiagnosticOptions['description'] {
    return this.options.description;
  }
  get severity(): CompilerDiagnosticOptions['severity'] {
    return this.options.severity;
  }
  get suggestions(): CompilerDiagnosticOptions['suggestions'] {
    return this.options.suggestions;
  }
  get category(): ErrorCategory {
    return this.options.category;
  }

  withDetail(detail: CompilerDiagnosticDetail): CompilerDiagnostic {
    this.options.details.push(detail);
    return this;
  }

  primaryLocation(): SourceLocation | null {
    const firstErrorDetail = this.options.details.filter(
      d => d.kind === 'error',
    )[0];
    return firstErrorDetail != null && firstErrorDetail.kind === 'error'
      ? firstErrorDetail.loc
      : null;
  }

  printErrorMessage(source: string, options: PrintErrorMessageOptions): string {
    const buffer = [
      printErrorSummary(this.severity, this.reason),
      '\n\n',
      this.description,
    ];
    for (const detail of this.options.details) {
      switch (detail.kind) {
        case 'error': {
          const loc = detail.loc;
          if (loc == null || typeof loc === 'symbol') {
            continue;
          }
          let codeFrame: string;
          try {
            codeFrame = printCodeFrame(source, loc, detail.message);
          } catch (e) {
            codeFrame = detail.message;
          }
          buffer.push('\n\n');
          if (loc.filename != null) {
            const line = loc.start.line;
            const column = options.eslint
              ? loc.start.column + 1
              : loc.start.column;
            buffer.push(`${loc.filename}:${line}:${column}\n`);
          }
          buffer.push(codeFrame);
          break;
        }
        case 'hint': {
          buffer.push('\n\n');
          buffer.push(detail.message);
          break;
        }
        default: {
          assertExhaustive(
            detail,
            `Unexpected detail kind ${(detail as any).kind}`,
          );
        }
      }
    }
    return buffer.join('');
  }

  toString(): string {
    const buffer = [printErrorSummary(this.severity, this.reason)];
    if (this.description != null) {
      buffer.push(`. ${this.description}.`);
    }
    const loc = this.primaryLocation();
    if (loc != null && typeof loc !== 'symbol') {
      buffer.push(` (${loc.start.line}:${loc.start.column})`);
    }
    return buffer.join('');
  }
}

/*
 * Each bailout or invariant in HIR lowering creates an {@link CompilerErrorDetail}, which is then
 * aggregated into a single {@link CompilerError} later.
 */
export class CompilerErrorDetail {
  options: CompilerErrorDetailOptions;

  constructor(options: CompilerErrorDetailOptions) {
    this.options = options;
  }

  get reason(): CompilerErrorDetailOptions['reason'] {
    return this.options.reason;
  }
  get description(): CompilerErrorDetailOptions['description'] {
    return this.options.description;
  }
  get severity(): CompilerErrorDetailOptions['severity'] {
    return this.options.severity;
  }
  get loc(): CompilerErrorDetailOptions['loc'] {
    return this.options.loc;
  }
  get suggestions(): CompilerErrorDetailOptions['suggestions'] {
    return this.options.suggestions;
  }
  get category(): ErrorCategory {
    return this.options.category;
  }

  primaryLocation(): SourceLocation | null {
    return this.loc;
  }

  printErrorMessage(source: string, options: PrintErrorMessageOptions): string {
    const buffer = [printErrorSummary(this.severity, this.reason)];
    if (this.description != null) {
      buffer.push(`\n\n${this.description}.`);
    }
    const loc = this.loc;
    if (loc != null && typeof loc !== 'symbol') {
      let codeFrame: string;
      try {
        codeFrame = printCodeFrame(source, loc, this.reason);
      } catch (e) {
        codeFrame = '';
      }
      buffer.push(`\n\n`);
      if (loc.filename != null) {
        const line = loc.start.line;
        const column = options.eslint ? loc.start.column + 1 : loc.start.column;
        buffer.push(`${loc.filename}:${line}:${column}\n`);
      }
      buffer.push(codeFrame);
      buffer.push('\n\n');
    }
    return buffer.join('');
  }

  toString(): string {
    const buffer = [printErrorSummary(this.severity, this.reason)];
    if (this.description != null) {
      buffer.push(`. ${this.description}.`);
    }
    const loc = this.loc;
    if (loc != null && typeof loc !== 'symbol') {
      buffer.push(` (${loc.start.line}:${loc.start.column})`);
    }
    return buffer.join('');
  }
}

export class CompilerError extends Error {
  details: Array<CompilerErrorDetail | CompilerDiagnostic> = [];
  printedMessage: string | null = null;

  static invariant(
    condition: unknown,
    options: Omit<CompilerErrorDetailOptions, 'severity' | 'category'>,
  ): asserts condition {
    if (!condition) {
      const errors = new CompilerError();
      errors.pushErrorDetail(
        new CompilerErrorDetail({
          ...options,
          category: ErrorCategory.Invariant,
          severity: ErrorSeverity.Invariant,
        }),
      );
      throw errors;
    }
  }

  static throwDiagnostic(options: CompilerDiagnosticOptions): never {
    const errors = new CompilerError();
    errors.pushDiagnostic(new CompilerDiagnostic(options));
    throw errors;
  }

  static throwTodo(
    options: Omit<CompilerErrorDetailOptions, 'severity' | 'category'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.Todo,
        category: ErrorCategory.Todo,
      }),
    );
    throw errors;
  }

  static throwInvalidJS(
    options: Omit<CompilerErrorDetailOptions, 'severity' | 'category'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.InvalidJS,
        category: ErrorCategory.Syntax,
      }),
    );
    throw errors;
  }

  static throwInvalidReact(
    options: Omit<CompilerErrorDetailOptions, 'severity'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.InvalidReact,
      }),
    );
    throw errors;
  }

  static throwInvalidConfig(
    options: Omit<CompilerErrorDetailOptions, 'severity' | 'category'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.InvalidConfig,
        category: ErrorCategory.Config,
      }),
    );
    throw errors;
  }

  static throw(options: CompilerErrorDetailOptions): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(new CompilerErrorDetail(options));
    throw errors;
  }

  constructor(...args: Array<any>) {
    super(...args);
    this.name = 'ReactCompilerError';
    this.details = [];
  }

  override get message(): string {
    return this.printedMessage ?? this.toString();
  }

  override set message(_message: string) {}

  override toString(): string {
    if (this.printedMessage) {
      return this.printedMessage;
    }
    if (Array.isArray(this.details)) {
      return this.details.map(detail => detail.toString()).join('\n\n');
    }
    return this.name;
  }

  withPrintedMessage(
    source: string,
    options: PrintErrorMessageOptions,
  ): CompilerError {
    this.printedMessage = this.printErrorMessage(source, options);
    return this;
  }

  printErrorMessage(source: string, options: PrintErrorMessageOptions): string {
    if (options.eslint && this.details.length === 1) {
      return this.details[0].printErrorMessage(source, options);
    }
    return (
      `Found ${this.details.length} error${this.details.length === 1 ? '' : 's'}:\n\n` +
      this.details
        .map(detail => detail.printErrorMessage(source, options).trim())
        .join('\n\n')
    );
  }

  merge(other: CompilerError): void {
    this.details.push(...other.details);
  }

  pushDiagnostic(diagnostic: CompilerDiagnostic): void {
    this.details.push(diagnostic);
  }

  push(options: CompilerErrorDetailOptions): CompilerErrorDetail {
    const detail = new CompilerErrorDetail({
      category: options.category,
      reason: options.reason,
      description: options.description ?? null,
      severity: options.severity,
      suggestions: options.suggestions,
      loc: typeof options.loc === 'symbol' ? null : options.loc,
    });
    return this.pushErrorDetail(detail);
  }

  pushErrorDetail(detail: CompilerErrorDetail): CompilerErrorDetail {
    this.details.push(detail);
    return detail;
  }

  hasErrors(): boolean {
    return this.details.length > 0;
  }

  asResult(): Result<void, CompilerError> {
    return this.hasErrors() ? Err(this) : Ok(undefined);
  }

  /*
   * An error is critical if it means the compiler has entered into a broken state and cannot
   * continue safely. Other expected errors such as Todos mean that we can skip over that component
   * but otherwise continue compiling the rest of the app.
   */
  isCritical(): boolean {
    return this.details.some(detail => {
      switch (detail.severity) {
        case ErrorSeverity.Invariant:
        case ErrorSeverity.InvalidJS:
        case ErrorSeverity.InvalidReact:
        case ErrorSeverity.InvalidConfig:
        case ErrorSeverity.UnsupportedJS: {
          return true;
        }
        case ErrorSeverity.CannotPreserveMemoization:
        case ErrorSeverity.Todo: {
          return false;
        }
        default: {
          assertExhaustive(detail.severity, 'Unhandled error severity');
        }
      }
    });
  }
}

function printCodeFrame(
  source: string,
  loc: t.SourceLocation,
  message: string,
): string {
  return codeFrameColumns(
    source,
    {
      start: {
        line: loc.start.line,
        column: loc.start.column + 1,
      },
      end: {
        line: loc.end.line,
        column: loc.end.column + 1,
      },
    },
    {
      message,
    },
  );
}

function printErrorSummary(severity: ErrorSeverity, message: string): string {
  let severityCategory: string;
  switch (severity) {
    case ErrorSeverity.InvalidConfig:
    case ErrorSeverity.InvalidJS:
    case ErrorSeverity.InvalidReact:
    case ErrorSeverity.UnsupportedJS: {
      severityCategory = 'Error';
      break;
    }
    case ErrorSeverity.CannotPreserveMemoization: {
      severityCategory = 'Memoization';
      break;
    }
    case ErrorSeverity.Invariant: {
      severityCategory = 'Invariant';
      break;
    }
    case ErrorSeverity.Todo: {
      severityCategory = 'Todo';
      break;
    }
    default: {
      assertExhaustive(severity, `Unexpected severity '${severity}'`);
    }
  }
  return `${severityCategory}: ${message}`;
}

/**
 * See getRuleForCategory() for how these map to ESLint rules
 */
export enum ErrorCategory {
  // Checking for valid hooks usage (non conditional, non-first class, non reactive, etc)
  Hooks = 'Hooks',

  // Checking for no capitalized calls (not definitively an error, hence separating)
  CapitalizedCalls = 'CapitalizedCalls',

  // Checking for static components
  StaticComponents = 'StaticComponents',

  // Checking for valid usage of manual memoization
  UseMemo = 'UseMemo',

  // Checks that manual memoization is preserved
  PreserveManualMemo = 'PreserveManualMemo',

  // Checking for no mutations of props, hook arguments, hook return values
  Immutability = 'Immutability',

  // Checking for assignments to globals
  Globals = 'Globals',

  // Checking for valid usage of refs, ie no access during render
  Refs = 'Refs',

  // Checks for memoized effect deps
  EffectDependencies = 'EffectDependencies',

  // Checks for no setState in effect bodies
  EffectSetState = 'EffectSetState',

  EffectDerivationsOfState = 'EffectDerivationsOfState',

  // Validates against try/catch in place of error boundaries
  ErrorBoundaries = 'ErrorBoundaries',

  // Checking for pure functions
  Purity = 'Purity',

  // Validates against setState in render
  RenderSetState = 'RenderSetState',

  // Internal invariants
  Invariant = 'Invariant',

  // Todos
  Todo = 'Todo',

  // Syntax errors
  Syntax = 'Syntax',

  // Checks for use of unsupported syntax
  UnsupportedSyntax = 'UnsupportedSyntax',

  // Config errors
  Config = 'Config',

  // Gating error
  Gating = 'Gating',

  // Suppressions
  Suppression = 'Suppression',

  // Issues with auto deps
  AutomaticEffectDependencies = 'AutomaticEffectDependencies',

  // Issues with `fire`
  Fire = 'Fire',

  // fbt-specific issues
  FBT = 'FBT',
}

export type LintRule = {
  // Stores the category the rule corresponds to, used to filter errors when reporting
  category: ErrorCategory;

  /**
   * The "name" of the rule as it will be used by developers to enable/disable, eg
   * "eslint-disable-nest line <name>"
   */
  name: string;

  /**
   * A description of the rule that appears somewhere in ESLint. This does not affect
   * how error messages are formatted
   */
  description: string;

  /**
   * If true, this rule will automatically appear in the default, "recommended" ESLint
   * rule set. Otherwise it will be part of an `allRules` export that developers can
   * use to opt-in to showing output of all possible rules.
   *
   * NOTE: not all validations are enabled by default! Setting this flag only affects
   * whether a given rule is part of the recommended set. The corresponding validation
   * also should be enabled by default if you want the error to actually show up!
   */
  recommended: boolean;
};

export function getRuleForCategory(category: ErrorCategory): LintRule {
  switch (category) {
    case ErrorCategory.AutomaticEffectDependencies: {
      return {
        category,
        name: 'automatic-effect-dependencies',
        description:
          'Verifies that automatic effect dependencies are compiled if opted-in',
        recommended: true,
      };
    }
    case ErrorCategory.CapitalizedCalls: {
      return {
        category,
        name: 'capitalized-calls',
        description:
          'Validates against calling capitalized functions/methods instead of using JSX',
        recommended: false,
      };
    }
    case ErrorCategory.Config: {
      return {
        category,
        name: 'config',
        description: 'Validates the configuration',
        recommended: true,
      };
    }
    case ErrorCategory.EffectDependencies: {
      return {
        category,
        name: 'memoized-effect-dependencies',
        description: 'Validates that effect dependencies are memoized',
        recommended: false,
      };
    }
    case ErrorCategory.EffectDerivationsOfState: {
      return {
        category,
        name: 'no-deriving-state-in-effects',
        description:
          'Validates against deriving values from state in an effect',
        recommended: false,
      };
    }
    case ErrorCategory.EffectSetState: {
      return {
        category,
        name: 'set-state-in-effect',
        description:
          'Validates against calling setState synchronously in an effect',
        recommended: true,
      };
    }
    case ErrorCategory.ErrorBoundaries: {
      return {
        category,
        name: 'error-boundaries',
        description:
          'Validates usage of error boundaries instead of try/catch for errors in JSX',
        recommended: true,
      };
    }
    case ErrorCategory.FBT: {
      return {
        category,
        name: 'fbt',
        description: 'Validates usage of fbt',
        recommended: false,
      };
    }
    case ErrorCategory.Fire: {
      return {
        category,
        name: 'fire',
        description: 'Validates usage of `fire`',
        recommended: false,
      };
    }
    case ErrorCategory.Gating: {
      return {
        category,
        name: 'gating',
        description: 'Validates configuration of gating mode',
        recommended: true,
      };
    }
    case ErrorCategory.Globals: {
      return {
        category,
        name: 'globals',
        description:
          'Validates against assignment/mutation of globals during render',
        recommended: true,
      };
    }
    case ErrorCategory.Hooks: {
      return {
        category,
        name: 'hooks',
        description: 'Validates the rules of hooks',
        /**
         * TODO: the "Hooks" rule largely reimplements the "rules-of-hooks" non-compiler rule.
         * We need to dedeupe these (moving the remaining bits into the compiler) and then enable
         * this rule.
         */
        recommended: false,
      };
    }
    case ErrorCategory.Immutability: {
      return {
        category,
        name: 'immutability',
        description:
          'Validates that immutable values (props, state, etc) are not mutated',
        recommended: true,
      };
    }
    case ErrorCategory.Invariant: {
      return {
        category,
        name: 'invariant',
        description: 'Internal invariants',
        recommended: false,
      };
    }
    case ErrorCategory.PreserveManualMemo: {
      return {
        category,
        name: 'preserve-manual-memoization',
        description:
          'Validates that existing manual memoized is preserved by the compiler',
        recommended: true,
      };
    }
    case ErrorCategory.Purity: {
      return {
        category,
        name: 'purity',
        description:
          'Validates that the component/hook is pure, and does not call known-impure functions',
        recommended: true,
      };
    }
    case ErrorCategory.Refs: {
      return {
        category,
        name: 'refs',
        description:
          'Validates correct usage of refs, not reading/writing during render',
        recommended: true,
      };
    }
    case ErrorCategory.RenderSetState: {
      return {
        category,
        name: 'set-state-in-render',
        description: 'Validates against setting state during render',
        recommended: true,
      };
    }
    case ErrorCategory.StaticComponents: {
      return {
        category,
        name: 'static-components',
        description:
          'Validates that components are static, not recreated every render',
        recommended: true,
      };
    }
    case ErrorCategory.Suppression: {
      return {
        category,
        name: 'rule-suppression',
        description: 'Validates against suppression of other rules',
        recommended: false,
      };
    }
    case ErrorCategory.Syntax: {
      return {
        category,
        name: 'syntax',
        description: 'Validates against invalid syntax',
        recommended: false,
      };
    }
    case ErrorCategory.Todo: {
      return {
        category,
        name: 'todo',
        description: 'Unimplemented features',
        recommended: false,
      };
    }
    case ErrorCategory.UnsupportedSyntax: {
      return {
        category,
        name: 'unsupported-syntax',
        description: 'Validates against syntax that we do not plan to support',
        recommended: true,
      };
    }
    case ErrorCategory.UseMemo: {
      return {
        category,
        name: 'use-memo',
        description: 'Validates usage of the useMemo() hook',
        recommended: true,
      };
    }
    default: {
      assertExhaustive(category, `Unsupported category ${category}`);
    }
  }
}

export const LintRules: Array<LintRule> = Object.keys(ErrorCategory).map(
  category => getRuleForCategory(category as any),
);
