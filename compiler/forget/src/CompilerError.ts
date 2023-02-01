import { Node, NodePath } from "@babel/traverse";
import { SourceLocation as BabelSourceLocation } from "@babel/types";
import { SourceLocation } from "./HIR";
import { ExtractClassProperties } from "./Utils/types";
import { assertExhaustive } from "./Utils/utils";

export enum ErrorSeverity {
  InvalidInput = "InvalidInput",
  Todo = "Todo",
  Invariant = "Invariant",
}

export type CompilerErrorOptions = {
  reason: string;
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

export function tryPrintCodeFrame(
  options: CompilerErrorOptions
): string | null {
  if (options.nodePath == null) return null;
  try {
    return options.nodePath
      .buildCodeFrameError(
        options.reason,
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
  severity: ErrorSeverity;
  codeframe: string | null;
  loc: BabelSourceLocation | null;

  constructor(options: CompilerErrorDetailOptions) {
    this.reason = options.reason;
    this.severity = options.severity;
    this.codeframe = options.codeframe;
    this.loc = options.loc;
  }

  printErrorMessage(): string {
    if (this.codeframe != null) {
      return this.codeframe;
    }
    const buffer = [`${this.severity}: ${this.reason}`];
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

  static invariant(reason: string, loc: SourceLocation): never {
    const errors = new CompilerError();
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        loc: typeof loc === "symbol" ? null : loc,
        reason,
        severity: ErrorSeverity.Invariant,
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

  override toString() {
    return this.details.map((detail) => detail.toString()).join("\n\n");
  }

  push(options: CompilerErrorOptions): CompilerErrorDetail {
    const detail = new CompilerErrorDetail({
      reason: options.reason,
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
}
