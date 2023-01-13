import { SourceLocation } from "./HIR";
import type { ExtractClassProperties } from "./Utils/types";

export enum ErrorSeverity {
  InvalidInput = "InvalidInput",
  Todo = "Todo",
}

export type CompilerErrorOptions = ExtractClassProperties<CompilerError>;

export class CompilerError {
  severity: ErrorSeverity;
  reason: string;
  source: string | null;
  loc: SourceLocation | null;

  constructor(options: CompilerErrorOptions) {
    this.severity = options.severity;
    this.reason = options.reason;
    this.source = options.source;
    this.loc = options.loc;
  }

  toString(): string {
    const buffer = [`[${this.severity.toUpperCase()}] ${this.reason}`];
    if (this.loc != null && typeof this.loc != "symbol") {
      buffer.push(` on lines ${this.loc.start.line}:${this.loc.end.line}`);
    }
    if (this.source != null) {
      buffer.push(`\n${this.source}`);
    }
    return `Forget Error: ${buffer.join("")}`;
  }
}
