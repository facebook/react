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
import {ErrorSeverity} from './Utils/CompilerErrorSeverity';
import {
  ErrorCode,
  ErrorCodeDetails,
  LinterCategory,
} from './Utils/CompilerErrorCodes';
export {ErrorSeverity};
export {ErrorCode, ErrorCodeDetails, LinterCategory};

export type CompilerDiagnosticOptions = {
  severity: ErrorSeverity;
  category: string;
  description?: string | null | undefined;
  details: Array<CompilerDiagnosticDetail>;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
  linterCategory?: LinterCategory | null | undefined;
};

export type CompilerDiagnosticDetail =
  /**
   * A/the source of the error
   */
  {
    kind: 'error';
    loc: SourceLocation | null;
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

export type PlainCompilerErrorDetailOptions = {
  errorCode?: void;
  reason: string;
  description?: string | null | undefined;
  severity:
    | ErrorSeverity.Invariant
    | ErrorSeverity.Todo
    | ErrorSeverity.InvalidConfig;
  loc: SourceLocation | null;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
};
export type CodedCompilerErrorDetailOptions = {
  errorCode: ErrorCode;
  description?: string | null | undefined;
  loc: SourceLocation | null;
  suggestions?: Array<CompilerSuggestion> | null | undefined;
  linterCategory?: LinterCategory | null | undefined;
};

export type CompilerErrorDetailOptions =
  | PlainCompilerErrorDetailOptions
  | CodedCompilerErrorDetailOptions;

export type PrintErrorMessageOptions = {
  /**
   * ESLint uses 1-indexed columns and prints one error at a time
   * So it doesn't require the "Found # error(s)" text
   */
  eslint: boolean;
};

export function makeCompilerDiagnostic(
  code: ErrorCode,
  options?: {
    description?: string;
    suggestions?: Array<CompilerSuggestion> | null | undefined;
  },
): CompilerDiagnostic {
  return makeCompilerDiagnostic(code, options);
}

export class CompilerDiagnostic {
  options: CompilerDiagnosticOptions;

  /**
   * Constructor is private to enforce that we either only create invariant diagnostics
   * or use ErrorCodes
   */
  private constructor(options: CompilerDiagnosticOptions) {
    this.options = options;
  }

  static create<
    T extends CompilerDiagnosticOptions & {severity: ErrorSeverity.Invariant},
  >(options: Omit<T, 'details'>): CompilerDiagnostic {
    return new CompilerDiagnostic({...options, details: []});
  }

  static fromCode(
    code: ErrorCode,
    options?: {
      description?: string;
      suggestions?: Array<CompilerSuggestion> | null | undefined;
      details?: Array<CompilerDiagnosticDetail> | null | undefined;
    },
  ): CompilerDiagnostic {
    const errorEntry = ErrorCodeDetails[code];
    let description = undefined;
    if (errorEntry.description != null) {
      description = errorEntry.description + '.';
    }
    if (options?.description != null && options.description.length > 0) {
      if (description != null && description.length > 0) {
        description += ' ';
      } else {
        description = '';
      }
      description += options.description + '.';
    }

    const diagnosticOptions: CompilerDiagnosticOptions = {
      severity: errorEntry.severity,
      category: errorEntry.reason,
      description,
      linterCategory: errorEntry.linterCategory,
      suggestions: options?.suggestions,
      details: options?.details ?? [],
    };

    return new CompilerDiagnostic(diagnosticOptions);
  }

  // TODO: remove after converting test fixtures to use printErrorMessage
  serialize(): unknown {
    return {options: {...this.options, linterCategory: undefined}};
  }

  get category(): CompilerDiagnosticOptions['category'] {
    return this.options.category;
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
  get linterCategory(): CompilerDiagnosticOptions['linterCategory'] {
    return this.options.linterCategory;
  }

  withDetail(detail: CompilerDiagnosticDetail): CompilerDiagnostic {
    this.options.details.push(detail);
    return this;
  }

  primaryLocation(): SourceLocation | null {
    return this.options.details.filter(d => d.kind === 'error')[0]?.loc ?? null;
  }

  printErrorMessage(source: string, options: PrintErrorMessageOptions): string {
    const buffer = [printErrorSummary(this.severity, this.category)];
    if (this.description != null) {
      buffer.push(`\n\n${this.description}`);
    }
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
        default: {
          assertExhaustive(
            detail.kind,
            `Unexpected detail kind ${(detail as any).kind}`,
          );
        }
      }
    }
    return buffer.join('');
  }

  toString(): string {
    const buffer = [printErrorSummary(this.severity, this.category)];
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

  static fromCode(
    code: ErrorCode,
    details?: {
      description?: string | null;
      loc?: SourceLocation | null;
      suggestions?: Array<CompilerSuggestion> | null | undefined;
    },
  ): CompilerErrorDetail {
    return new CompilerErrorDetail({
      ...details,
      errorCode: code,
    } as CodedCompilerErrorDetailOptions);
  }

  // TODO: remove after converting test fixtures to use printErrorMessage
  serialize(): unknown {
    return {
      options: {
        reason: this.reason,
        description: this.description,
        severity: this.severity,
        loc: this.loc,
        suggestions: this.suggestions,
      },
    };
  }

  get reason(): string {
    if (this.options.errorCode != null) {
      return ErrorCodeDetails[this.options.errorCode].reason;
    } else {
      return this.options.reason;
    }
  }
  get description(): string | null | undefined {
    if (this.options.errorCode != null) {
      let description = undefined;
      if (ErrorCodeDetails[this.options.errorCode].description != null) {
        description =
          ErrorCodeDetails[this.options.errorCode].description + '.';
      }
      if (
        this.options.description != null &&
        this.options.description.length > 0
      ) {
        if (description != null && description.length > 0) {
          description += ' ';
        } else {
          description = '';
        }
        description += this.options.description + '.';
      }
      return description;
    }
    return this.options.description
      ? this.options.description + '.'
      : this.options.description;
  }
  get severity(): ErrorSeverity {
    if (this.options.errorCode != null) {
      return ErrorCodeDetails[this.options.errorCode].severity;
    }
    return this.options.severity;
  }
  get loc(): CompilerErrorDetailOptions['loc'] {
    return this.options.loc;
  }
  get suggestions(): CompilerErrorDetailOptions['suggestions'] {
    return this.options.suggestions;
  }
  get linterCategory(): LinterCategory | null | undefined {
    if (this.options.errorCode != null) {
      return ErrorCodeDetails[this.options.errorCode].linterCategory;
    }
    return undefined;
  }

  primaryLocation(): SourceLocation | null {
    return this.loc;
  }

  printErrorMessage(source: string, options: PrintErrorMessageOptions): string {
    const buffer = [printErrorSummary(this.severity, this.reason)];
    if (this.description != null) {
      buffer.push(`\n\n${this.description}`);
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
    options: Omit<PlainCompilerErrorDetailOptions, 'severity'>,
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

  static throwDiagnostic(diagnostic: CompilerDiagnostic): never {
    const errors = new CompilerError();
    errors.pushDiagnostic(diagnostic);
    throw errors;
  }

  static throwTodo(
    options: Omit<PlainCompilerErrorDetailOptions, 'severity'>,
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({...options, severity: ErrorSeverity.Todo}),
    );
    throw errors;
  }

  static throwFromCode(
    code: ErrorCode,
    options?: {
      description?: string | null;
      loc?: SourceLocation | null;
      suggestions?: Array<CompilerSuggestion> | null | undefined;
    },
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(CompilerErrorDetail.fromCode(code, options));
    throw errors;
  }

  static throwInvalidConfig(
    options: Omit<PlainCompilerErrorDetailOptions, 'severity'>,
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
    if (options instanceof CompilerErrorDetail) {
      return this.pushErrorDetail(options);
    }
    const detail = new CompilerErrorDetail(options);
    return this.pushErrorDetail(detail);
  }

  pushErrorDetail(detail: CompilerErrorDetail): CompilerErrorDetail {
    this.details.push(detail);
    return detail;
  }

  pushErrorCode(
    code: ErrorCode,
    details?: {
      description?: string | null;
      loc?: SourceLocation | null;
      suggestions?: Array<CompilerSuggestion> | null | undefined;
    },
  ): CompilerErrorDetail {
    const detail = CompilerErrorDetail.fromCode(code, details);
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
