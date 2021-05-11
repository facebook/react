/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import invariant from "invariant";
import { CompilerOptions } from "./CompilerOptions";
import { CompilerOutputs, createCompilerOutputs } from "./CompilerOutputs";
import {
  buildDiagnostic,
  Diagnostic,
  DiagnosticLevel,
  DiagnosticOpts,
  ErrorCode,
  NoErrorCode,
  printDiagnostic,
  printPathCodeFrame,
} from "./Diagnostic";
import * as IR from "./IR";
import * as LIR from "./LIR";
import { Logger } from "./Logger";

type Bailout = {
  code: ErrorCode;
  reason: string;
  stack: string | null;
  source: string | null;
};

let mostRecentCompilerContext: CompilerContext | null = null;
/**
 * @returns CompilerContext used in the most recent call to {@link createCompilerDriver}
 */
export function getMostRecentCompilerContext(): CompilerContext {
  invariant(
    mostRecentCompilerContext != null,
    "Can only call getMostRecentCompilerContext() after a call to createCompilerDriver()"
  );
  return mostRecentCompilerContext;
}

function createInvariantError(format: string, ...args: any[]) {
  Error.stackTraceLimit = 13;
  let ii = 0;
  const error = new Error(format.replace(/%s/g, () => args[ii++]));
  error.name = "Invariant Violation";
  popStackFrames(error, 3);
  Error.stackTraceLimit = 10;
  return error;
}

function popStackFrames(e: Error, n: number) {
  if (e.stack == null) {
    return;
  }
  const stackframes = e.stack.split("\n");
  stackframes.splice(1, n);
  e.stack = stackframes.join("\n");
}

/**
 * Global shared mutable context throughout the compilation pipeline.
 */
export class CompilerContext {
  opts: CompilerOptions;
  outputs: CompilerOutputs = createCompilerOutputs();
  irProg: IR.Prog;
  lirProg: LIR.Prog;
  logger: Logger;
  diagnostics: Diagnostic[] = [];
  bailouts: Bailout[] = [];

  constructor(opts: CompilerOptions, prog: NodePath<t.Program>) {
    mostRecentCompilerContext = this;
    this.irProg = new IR.Prog(prog);
    this.lirProg = new LIR.Prog(this.irProg);
    this.opts = opts;
    this.logger = opts.logger;
  }

  createDiagnostic(opts: DiagnosticOpts): Diagnostic {
    const diag = buildDiagnostic(opts);
    this.diagnostics.push(diag);

    const loc = opts.path?.node.loc ?? null;
    this.logger.logEvent({
      name: "diagnostics",
      opts: {
        code: opts.code,
        loc,
      },
    });

    return diag;
  }

  /**
   * Record a compiler bailout, and emit a user-facing diagnostic. If this is not a user actionable
   * bailout, use {@link CompilerContext.bailoutWithoutDiagnostic} instead.
   */
  bailout(reason: string, opts: DiagnosticOpts) {
    const diag = this.createDiagnostic(opts);
    this.bailouts.push({
      reason,
      code: opts.code ?? NoErrorCode,
      source: printDiagnostic(diag),
      stack: null,
    });
    this.logger.logEvent({
      name: "bailout",
      reason,
    });
  }

  /**
   * Record a compiler bailout, with an optional Babel Path to track the source code that triggered
   * the bailout. If this is an actionable bailout (ie the user can fix this), use
   * {@link CompilerContext.bailout} instead.
   */
  bailoutWithoutDiagnostic(reason: string, path?: NodePath) {
    const source =
      path != null
        ? printPathCodeFrame(reason, DiagnosticLevel.Error, path)
        : null;
    this.bailouts.push({
      code: NoErrorCode,
      reason,
      source,
      stack: null,
    });
    this.logger.logEvent({
      name: "bailout",
      reason,
    });
  }

  /**
   * Record a bailout if there is an invariant violation and a recently created compiler context.
   * Note that no diagnostics are emitted. If a diagnostic is desired, use
   * {@link CompilerContext.bailout} instead.
   */
  invariant(
    condition: unknown,
    format: string,
    ...args: any[]
  ): asserts condition {
    if (condition) {
      return;
    }
    const error = createInvariantError(format, ...args);
    const reason = `InvariantViolation: ${error.message}`;
    const stack = error.stack ?? null;
    this.bailouts.push({
      code: NoErrorCode,
      reason,
      stack,
      source: null,
    });
    this.logger.logEvent({
      name: "bailout",
      reason,
    });
    throw error;
  }

  hasBailedOut(): boolean {
    return this.bailouts.length > 0;
  }
}
