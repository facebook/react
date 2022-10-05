/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { assertExhaustive } from "./Common/utils";
import { Name } from "./IR/Func";

export enum DiagnosticLevel {
  Error = "Error",
  Warning = "Warning",
}
type DiagnosticMessage = {
  level: DiagnosticLevel;
  body: string;
  suggestion: string | null;
};
export type Diagnostic = {
  code: ErrorCode;
  path: NodePath | null;
} & DiagnosticMessage;

class ForgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = DiagnosticLevel.Error;
  }
}
class ForgetWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = DiagnosticLevel.Warning;
  }
}

export function mapDiagnosticLevelToErrorCtor(level: DiagnosticLevel) {
  switch (level) {
    case DiagnosticLevel.Error:
      return ForgetError;
    case DiagnosticLevel.Warning:
      return ForgetWarning;
    default:
      assertExhaustive(level, `Unhandled diagnostic level: ${level}`);
  }
}

export function printPathCodeFrame(
  reason: string,
  level: DiagnosticLevel,
  path: NodePath
) {
  return path
    .buildCodeFrameError(reason, mapDiagnosticLevelToErrorCtor(level))
    .toString();
}

export function printDiagnostic({
  code,
  body,
  level,
  path,
  suggestion,
}: Diagnostic): string {
  let buffer = `${body} (${code})`;
  if (suggestion != null) {
    buffer = `${buffer}\n\n${suggestion}`;
  }
  if (path != null) {
    return printPathCodeFrame(buffer, level, path);
  } else {
    buffer = `${level}: ${buffer}`;
  }
  return buffer;
}

export function buildDiagnostic(opts: DiagnosticOpts): Diagnostic {
  const msg = getDiagnosticMessage(opts);
  const { code, path } = opts;
  return {
    code,
    path,
    ...msg,
  };
}

function getSource(node: NodePath | NodePath[] | null): string | null {
  if (node == null) {
    return null;
  }
  return Array.isArray(node)
    ? node.map((n) => n.getSource()).join(", ")
    : node.getSource();
}

/**
 * Utility type to enforce ErrorCode format. This should only be used in the
 * `ErrorCode` type to validate the format, elsewhere we should just pass
 * regular strings.
 */
type ParseCode<T> = T extends `E${number}` ? T : never;
export const NoErrorCode = "None";
// prettier-ignore
export type ErrorCode =
  | typeof NoErrorCode
  | ParseCode<"E0001">
  | ParseCode<"E0002">
  | ParseCode<"E0003">
  | ParseCode<"E0004">
  | ParseCode<"E0005">
  | ParseCode<"E0006">
  | ParseCode<"E0007">
  | ParseCode<"E0008">
  | ParseCode<"E0009">
  | ParseCode<"E0010">
  | ParseCode<"E0011">
  | ParseCode<"E0012">
  | ParseCode<"E0013">
  | ParseCode<"E0014">
  | ParseCode<"E0015">
  | ParseCode<"E0016">
  | ParseCode<"E0017">
  | ParseCode<"E0018">
  | ParseCode<"E0019">
  | ParseCode<"E0020">
  | ParseCode<"E0021">
  ;

// prettier-ignore
export type DiagnosticOpts =
  | { code: "E0001"; path: NodePath; context: null }
  | { code: "E0002"; path: NodePath; context: null }
  | { code: "E0003"; path: NodePath<t.Expression>; context: null }
  | { code: "E0004"; path: NodePath; context: null }
  | {
    code: "E0005";
    path: NodePath<t.ObjectProperty>;
    context: { callee: NodePath | NodePath[]; key: string };
  }
  | {
    code: "E0006";
    path: NodePath;
    context: {
      callee: NodePath | NodePath[];
      tupleLength: number;
      attemptedLength: number;
    };
  }
  | {
    code: "E0007";
    path: NodePath;
    context: {
      callee: NodePath | NodePath[];
    };
  }
  | { code: "E0008"; path: NodePath; context: { input: NodePath } }
  | { code: "E0009"; path: NodePath; context: { call: NodePath } }
  | { code: "E0010"; path: NodePath; context: { name: Name } }
  | { code: "E0011"; path: null; context: null }
  | { code: "E0012"; path: NodePath; context: null }
  | { code: "E0013"; path: NodePath; context: { name: Name } }
  | { code: "E0014"; path: NodePath; context: null }
  | { code: "E0015"; path: null; context: { error: Error } }
  | { code: "E0016"; path: NodePath; context: null }
  | { code: "E0017"; path: NodePath; context: null }
  | { code: "E0018"; path: NodePath; context: null }
  | { code: "E0019"; path: NodePath; context: null }
  | { code: "E0020"; path: NodePath; context: null }
  | { code: "E0021"; path: NodePath; context: { name: Name } }
  ;

function getDiagnosticMessage(opts: DiagnosticOpts): DiagnosticMessage {
  switch (opts.code) {
    case "E0001":
      return {
        level: DiagnosticLevel.Warning,
        body: "Forget does not currently support rest params in Component props.",
        suggestion: `Consider destructuring \`${getSource(opts.path)}\`.`,
      };
    case "E0002":
      return {
        level: DiagnosticLevel.Warning,
        body: "Forget does not currently support tracking the Component props object as a whole.",
        suggestion: `Consider destructuring \`${getSource(opts.path)}\`.`,
      };
    case "E0003":
      return {
        level: DiagnosticLevel.Warning,
        body: "Expression-body React functions are ignored.",
        suggestion: null,
      };
    case "E0004":
      return {
        level: DiagnosticLevel.Error,
        body: "React compiler currently only supports hooks at the Component's top level scope.",
        suggestion: `Move \`${opts.path}\` out of \`${opts.path.scope.path.parentPath}\`.`,
      };
    case "E0005":
      return {
        level: DiagnosticLevel.Warning,
        body: `\`${getSource(
          opts.context.callee
        )}\` does not have the member \`${
          opts.context.key
        }\` in its return value.`,
        suggestion: `Remove \`${opts.path}\`.`,
      };
    case "E0006":
      return {
        level: DiagnosticLevel.Warning,
        body: `\`${getSource(
          opts.context.callee
        )}\` returns a tuple of length ${opts.context.tupleLength}, got ${
          opts.context.attemptedLength
        } instead.`,
        suggestion: `Remove \`${opts.path}\`.`,
      };
    case "E0007":
      return {
        level: DiagnosticLevel.Warning,
        body: `\`${getSource(
          opts.context.callee
        )}\` does not have a return value.`,
        suggestion: `Do \`${getSource(opts.path.get("init"))}\` instead.`,
      };
    case "E0008":
      return {
        level: DiagnosticLevel.Error,
        body: "Values used to derive inputs (e.g. passed to Hooks) can only be immutably borrowed afterwards.",
        suggestion: `If you are mutating this value, try finish the local mutation before:

\`\`\`
${opts.context.input}
\`\`\`


If you are only reading this value, try annotating the value with \`/*readonly*/\` or \`/*immut*/\` in:
\`\`\`
${getSource(opts.path)}
\`\`\``,
      };
    case "E0009":
      return {
        level: DiagnosticLevel.Error,
        body: "React compiler currently only supports call expressions when using hooks.",
        suggestion: `Try changing \`${getSource(opts.path)}\` to \`${
          opts.context.call
        }\``,
      };
    case "E0010":
      const parentSource = getSource(opts.path.parentPath);
      return {
        level: DiagnosticLevel.Error,
        body: `\`${opts.context.name}\` is an immutable value enforced by React compiler, and cannot be reassigned or mutated.`,
        suggestion:
          parentSource == null
            ? "Remove the reassignment"
            : `Remove the reassignment: \`${parentSource}\``,
      };
    case "E0011":
      return {
        level: DiagnosticLevel.Error,
        body: "Function has multiple returns and `bailOnMultipleReturns` is enabled.",
        suggestion: null,
      };
    case "E0012":
      return {
        level: DiagnosticLevel.Error,
        body: "Function uses `useRef` hook and `bailOnUseRef` is enabled.",
        suggestion: null,
      };
    case "E0013":
      return {
        level: DiagnosticLevel.Error,
        body: `\`${opts.context.name}\` is an immutable value enforced by React compiler, and cannot be mutated.`,
        suggestion: `Remove the mutation: \`${getSource(
          opts.path.parentPath
        )}\``,
      };
    case "E0014":
      return {
        level: DiagnosticLevel.Error,
        body: "Function uses a ref-like value from props, arguments or context and `bailOnUseRef` is enabled.",
        suggestion: null,
      };
    case "E0015":
      return {
        level: DiagnosticLevel.Error,
        body: `Unexpected error detected: ${opts.context.error}.`,
        suggestion: null,
      };
    case "E0016":
      return {
        level: DiagnosticLevel.Error,
        body: "A React hook call is under an invalid namespace.",
        suggestion: null,
      };
    case "E0017":
      return {
        level: DiagnosticLevel.Error,
        body: "A hook call is under a valid namespace, but invalid according to eslint.",
        suggestion: null,
      };
    case "E0018":
      return {
        level: DiagnosticLevel.Error,
        body: "React components should not be called directly, but instead constructed using JSX. Other functions should not be capitalized.",
        suggestion: null,
      };
    case "E0019":
      return {
        level: DiagnosticLevel.Error,
        body: "React components not defined on the top level are not supported by Forget.",
        suggestion: null,
      };
    case "E0020":
      return {
        level: DiagnosticLevel.Error,
        body: "Forget does not support the use of the arguments object.",
        suggestion: null,
      };
    case "E0021":
      return {
        level: DiagnosticLevel.Error,
        body: `Input "${opts.context.name}" is detected in a DepGraph cycle. This is dangenrous since Forget may (though not always) generate broken code like accessing "c_input" before it is defined.`,
        suggestion: null,
      };
    default:
      assertExhaustive(opts, `Unhandled error code ${opts}`);
  }
}
