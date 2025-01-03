/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {SourceLocation} from './HIR';
import {assertExhaustive} from './Utils/utils';

export enum ErrorSeverity {
  /**
   * Invalid JS syntax, or valid syntax that is semantically invalid which may indicate some
   * misunderstanding on the user’s part.
   */
  InvalidJS = 'InvalidJS',
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
  reason: string;
  description?: string | null | undefined;
  severity: ErrorSeverity;
  loc: SourceLocation | null;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
};

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

  printErrorMessage(): string {
    const buffer = [`${this.severity}: ${this.reason}`];
    if (this.description != null) {
      buffer.push(`. ${this.description}`);
    }
    if (this.loc != null && typeof this.loc !== 'symbol') {
      buffer.push(` (${this.loc.start.line}:${this.loc.end.line})`);
    }
    return buffer.join('');
  }

  toString(): string {
    return this.printErrorMessage();
  }
}

export class CompilerError extends Error {
  details: Array<CompilerErrorDetail> = [];

  static invariant(
    condition: unknown,
    options: Omit<CompilerErrorDetailOptions, 'severity'>,
  ): asserts condition {
    if (!condition) {
      const errors = new CompilerError();
      errors.pushErrorDetail(
        new CompilerErrorDetail({
          ...options,
          severity: ErrorSeverity.Invariant,
        }),
      );
      throw errors;
    }
  }

  static throwTodo(
    options: Omit<CompilerErrorDetailOptions, 'severity'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({...options, severity: ErrorSeverity.Todo}),
    );
    throw errors;
  }

  static throwInvalidJS(
    options: Omit<CompilerErrorDetailOptions, 'severity'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.InvalidJS,
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
    options: Omit<CompilerErrorDetailOptions, 'severity'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        ...options,
        severity: ErrorSeverity.InvalidConfig,
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
  }

  override get message(): string {
    return this.toString();
  }

  override set message(_message: string) {}

  override toString(): string {
    return this.details.map(detail => detail.toString()).join('\n\n');
  }

  push(options: CompilerErrorDetailOptions): CompilerErrorDetail {
    const detail = new CompilerErrorDetail({
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
          return true;
        case ErrorSeverity.CannotPreserveMemoization:
        case ErrorSeverity.Todo:
          return false;
        default:
          assertExhaustive(detail.severity, 'Unhandled error severity');
      }
    });
  }
}
