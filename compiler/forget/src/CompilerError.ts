import { Node, NodePath } from "@babel/core";
import { assertExhaustive } from "./Utils/utils";

export enum ErrorSeverity {
  InvalidInput = "InvalidInput",
  Todo = "Todo",
}

export type CompilerErrorOptions = {
  reason: string;
  severity: ErrorSeverity;
  nodePath: AnyNodePath | null;
};
type AnyNodePath = NodePath<Node | null | undefined>;
type CompilerErrorKind = typeof InvalidInputError | typeof TodoError;

function mapSeverityToErrorCtor(severity: ErrorSeverity): CompilerErrorKind {
  switch (severity) {
    case ErrorSeverity.InvalidInput:
      return InvalidInputError;
    case ErrorSeverity.Todo:
      return TodoError;
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

/**
 * Each bailout or invariant in HIR lowering creates an {@link CompilerErrorDetail}, which is then
 * aggregated into a single {@link CompilerError} later.
 */
export class CompilerErrorDetail {
  reason: string;
  severity: ErrorSeverity;
  /**
   * If a NodePath is provided, we will prefer Babel's built in codeframe error generation which
   * will print error markers in the correct location.
   */
  nodePath: AnyNodePath | null;

  constructor(options: CompilerErrorOptions) {
    this.reason = options.reason;
    this.severity = options.severity;
    this.nodePath = options.nodePath;
  }

  get errorMessage(): string {
    const buffer = [`${this.severity}: ${this.reason}`];
    if (this.nodePath != null && this.nodePath.node?.loc != null) {
      buffer.push(
        ` (${this.nodePath.node.loc.start.line}:${this.nodePath.node.loc.end.line})`
      );
    }
    return buffer.join("");
  }

  get codeFrame() {
    if (this.nodePath == null) {
      return this.errorMessage;
    }
    try {
      return this.nodePath
        .buildCodeFrameError(this.reason, mapSeverityToErrorCtor(this.severity))
        .toString();
    } catch {
      return this.errorMessage;
    }
  }

  toString(): string {
    return `[ReactForget] ${this.errorMessage}`;
  }
}

export class CompilerError extends Error {
  details: CompilerErrorDetail[] = [];

  constructor(details: CompilerErrorDetail[], ...args: any[]) {
    super(...args);
    this.details = details;
    this.message = this.toString();
  }

  override toString() {
    return this.details.map((detail) => detail.toString()).join("\n\n");
  }
}
