/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceLocation } from "./HIR";
import type { ExtractClassProperties } from "./Utils/types";
import { assertExhaustive } from "./Utils/utils";

export enum ErrorSeverity {
  /**
   * Unexpected syntax or input that may not be safe to compile.
   */
  InvalidInput = "InvalidInput",
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
  loc: SourceLocation | null;
};
type CompilerErrorDetailOptions = ExtractClassProperties<CompilerErrorDetail>;

/**
 * Each bailout or invariant in HIR lowering creates an {@link CompilerErrorDetail}, which is then
 * aggregated into a single {@link CompilerError} later.
 */
export class CompilerErrorDetail {
  reason: string;
  description: string | null;
  severity: ErrorSeverity;
  loc: SourceLocation | null;

  constructor(options: CompilerErrorDetailOptions) {
    this.reason = options.reason;
    this.description = options.description;
    this.severity = options.severity;
    this.loc = options.loc;
  }

  printErrorMessage(): string {
    const buffer = [`${this.severity}: ${this.reason}`];
    if (this.description !== null) {
      buffer.push(`. ${this.description}`);
    }
    if (this.loc != null && typeof this.loc !== "symbol") {
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
    condition: unknown,
    reason: string,
    loc: SourceLocation | null,
    description: string | null = null
  ): asserts condition {
    if (!condition) {
      const errors = new CompilerError();
      errors.pushErrorDetail(
        new CompilerErrorDetail({
          description,
          loc,
          reason,
          severity: ErrorSeverity.Invariant,
        })
      );
      throw errors;
    }
  }

  static todo(
    reason: string,
    loc: SourceLocation | null,
    description: string | null = null
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        description,
        loc,
        reason,
        severity: ErrorSeverity.Todo,
      })
    );
    throw errors;
  }

  static invalidInput(
    reason: string,
    loc: SourceLocation | null,
    description: string | null = null
  ): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        description,
        loc,
        reason,
        severity: ErrorSeverity.InvalidInput,
      })
    );
    throw errors;
  }

  constructor(...args: any[]) {
    super(...args);
    this.name = "ReactForgetCompilerError";
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
      loc: typeof options.loc === "symbol" ? null : options.loc,
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
        case ErrorSeverity.InvalidInput:
          return true;
        case ErrorSeverity.Todo:
          return false;
        default:
          assertExhaustive(detail.severity, "Unhandled error severity");
      }
    });
  }
}
