import { Node, NodePath } from "@babel/core";
import type { ExtractClassProperties } from "./Utils/types";
import { assertExhaustive } from "./Utils/utils";

export enum ErrorSeverity {
  InvalidInput = "InvalidInput",
  Todo = "Todo",
}

export type CompilerErrorOptions = ExtractClassProperties<CompilerError>;
type AnyNodePath = NodePath<Node | null | undefined>;

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

function mapSeverityToErrorCtor(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.InvalidInput:
      return InvalidInputError;
    case ErrorSeverity.Todo:
      return TodoError;
    default:
      assertExhaustive(severity, `Unhandled severity level: ${severity}`);
  }
}

function printPathCodeFrame(
  reason: string,
  severity: ErrorSeverity,
  path: AnyNodePath
) {
  return path
    .buildCodeFrameError(reason, mapSeverityToErrorCtor(severity))
    .toString();
}

export class CompilerError {
  severity: ErrorSeverity;
  reason: string;
  /**
   * If a NodePath is provided, we will prefer Babel's built in codeframe error generation which
   * will print error markers in the correct location.
   */
  nodePath: AnyNodePath | null;

  constructor(options: CompilerErrorOptions) {
    this.severity = options.severity;
    this.reason = options.reason;
    this.nodePath = options.nodePath;
  }

  toString(): string {
    const buffer = [];
    if (this.nodePath != null) {
      buffer.push(
        printPathCodeFrame(this.reason, this.severity, this.nodePath)
      );
    } else {
      buffer.push(`${this.severity}: ${this.reason}`);
    }
    return `[ReactForget] ${buffer.join("")}`;
  }
}
