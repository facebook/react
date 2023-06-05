/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, NodePath } from "@babel/traverse";
import type { SourceLocation as BabelSourceLocation } from "@babel/types";
import type { SourceLocation } from "./HIR";
import type { ExtractClassProperties } from "./Utils/types";
import { assertExhaustive } from "./Utils/utils";

export enum ErrorSeverity {
  /**
   * Unexpected syntax or input that may not be safe to compile.
   */
  InvalidInput = "InvalidInput",
  /**
   * User code contains unsafe React patterns that might not be safe to compile, but does not mean
   * the compiler has bugs. This typically means we can skip over the affected files, but other
   * files without these errors can still be compiled.
   */
  UnsafeInput = "UnsafeInput",
  /**
   * Unhandled syntax that we don't support yet.
   */
  Todo = "Todo",
  /**
   * An unexpected internal error in the compiler that indicates critical issues that can panic
   * the compiler.
   */
  Invariant = "Invariant",
}

export type CompilerErrorOptions = {
  reason: string;
  description?: string | null | undefined;
  severity: ErrorSeverity;
  nodePath: AnyNodePath | null;
};
type AnyNodePath = NodePath<Node | null | undefined>;
type CompilerErrorKind = typeof InvalidInputError | typeof TodoError;
type CompilerErrorDetailOptions = ExtractClassProperties<CompilerErrorDetail>;

function mapSeverityToErrorCtor(severity: ErrorSeverity): CompilerErrorKind {
  switch (severity) {
    case ErrorSeverity.InvalidInput:
      return InvalidInputError;
    case ErrorSeverity.Todo:
      return TodoError;
    case ErrorSeverity.Invariant:
      return InvariantError;
    case ErrorSeverity.UnsafeInput:
      return UnsafeInputError;
    default:
      assertExhaustive(severity, `Unhandled severity level: ${severity}`);
  }
}
class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `${ErrorSeverity.InvalidInput}Error`;
  }
}
class TodoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `${ErrorSeverity.Todo}Error`;
  }
}
class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `${ErrorSeverity.Invariant}Error`;
  }
}
class UnsafeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `${ErrorSeverity.UnsafeInput}Error`;
  }
}

export function tryPrintCodeFrame(
  options: CompilerErrorOptions
): string | null {
  if (options.nodePath == null) return null;
  try {
    return options.nodePath
      .buildCodeFrameError(
        options.reason +
          (options.description != null ? `. ${options.description}` : ""),
        mapSeverityToErrorCtor(options.severity)
      )
      .toString();
  } catch {
    return null;
  }
}

/**
 * Each bailout or invariant in HIR lowering creates an {@link CompilerErrorDetail}, which is then
 * aggregated into a single {@link CompilerError} later.
 */
export class CompilerErrorDetail {
  reason: string;
  description: string | null;
  severity: ErrorSeverity;
  codeframe: string | null;
  loc: BabelSourceLocation | null;

  constructor(options: CompilerErrorDetailOptions) {
    this.reason = options.reason;
    this.description = options.description;
    this.severity = options.severity;
    this.codeframe = options.codeframe;
    this.loc = options.loc;
  }

  printErrorMessage(): string {
    if (this.codeframe != null) {
      return this.codeframe;
    }
    const buffer = [`${this.severity}: ${this.reason}`];
    if (this.description !== null) {
      buffer.push(`. ${this.description}`);
    }
    if (this.loc != null) {
      buffer.push(` (${this.loc.start.line}:${this.loc.end.line})`);
    }
    return buffer.join("");
  }

  toString(): string {
    return `[ReactForget] ${this.printErrorMessage()}`;
  }
}

export class CompilerError extends Error {
  details: CompilerErrorDetail[] = [];

  static invariant(
    reason: string,
    loc: SourceLocation,
    description: string | null = null
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description,
        loc: typeof loc === "symbol" ? null : loc,
        reason,
        severity: ErrorSeverity.Invariant,
      })
    );
    throw errors;
  }

  static todo(
    reason: string,
    loc: SourceLocation,
    description: string | null = null
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description,
        loc: typeof loc === "symbol" ? null : loc,
        reason,
        severity: ErrorSeverity.Todo,
      })
    );
    throw errors;
  }

  static invalidInput(
    reason: string,
    loc: SourceLocation,
    description: string | null = null
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description,
        loc: typeof loc === "symbol" ? null : loc,
        reason,
        severity: ErrorSeverity.InvalidInput,
      })
    );
    throw errors;
  }

  constructor(...args: any[]) {
    super(...args);
  }

  override get message(): string {
    return this.toString();
  }

  override set message(_message: string) {}

  override toString(): string {
    return this.details.map((detail) => detail.toString()).join("\n\n");
  }

  push(options: CompilerErrorOptions): CompilerErrorDetail {
    const detail = new CompilerErrorDetail({
      reason: options.reason,
      description: options.description ?? null,
      severity: options.severity,
      codeframe: tryPrintCodeFrame(options),
      loc: options.nodePath?.node?.loc ?? null,
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

  /**
   * An error is critical if it means the compiler has entered into a broken state and cannot
   * continue safely. Other expected errors such as Todos mean that we can skip over that component
   * but otherwise continue compiling the rest of the app.
   */
  isCritical(): boolean {
    return this.details.some((detail) => {
      switch (detail.severity) {
        case ErrorSeverity.Invariant:
          return true;
        case ErrorSeverity.InvalidInput:
        case ErrorSeverity.Todo:
        case ErrorSeverity.UnsafeInput:
          return false;
        default:
          assertExhaustive(detail.severity, "Unhandled error severity");
      }
    });
  }
}
