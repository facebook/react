/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStackTrace} from 'shared/ReactTypes';

let framesToSkip: number = 0;
let collectedStackTrace: null | ReactStackTrace = null;

const identifierRegExp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

function getMethodCallName(callSite: CallSite): string {
  const typeName = callSite.getTypeName();
  const methodName = callSite.getMethodName();
  const functionName = callSite.getFunctionName();
  let result = '';
  if (functionName) {
    if (
      typeName &&
      identifierRegExp.test(functionName) &&
      functionName !== typeName
    ) {
      result += typeName + '.';
    }
    result += functionName;
    if (
      methodName &&
      functionName !== methodName &&
      !functionName.endsWith('.' + methodName) &&
      !functionName.endsWith(' ' + methodName)
    ) {
      result += ' [as ' + methodName + ']';
    }
  } else {
    if (typeName) {
      result += typeName + '.';
    }
    if (methodName) {
      result += methodName;
    } else {
      result += '<anonymous>';
    }
  }
  return result;
}

function collectStackTrace(
  error: Error,
  structuredStackTrace: CallSite[],
): string {
  const result: ReactStackTrace = [];
  // Collect structured stack traces from the callsites.
  // We mirror how V8 serializes stack frames and how we later parse them.
  for (let i = framesToSkip; i < structuredStackTrace.length; i++) {
    const callSite = structuredStackTrace[i];
    let name = callSite.getFunctionName() || '<anonymous>';
    if (name === 'react-stack-bottom-frame') {
      // Skip everything after the bottom frame since it'll be internals.
      break;
    } else if (callSite.isNative()) {
      result.push([name, '', 0, 0, 0, 0]);
    } else {
      // We encode complex function calls as if they're part of the function
      // name since we cannot simulate the complex ones and they look the same
      // as function names in UIs on the client as well as stacks.
      if (callSite.isConstructor()) {
        name = 'new ' + name;
      } else if (!callSite.isToplevel()) {
        name = getMethodCallName(callSite);
      }
      if (name === '<anonymous>') {
        name = '';
      }
      let filename = callSite.getScriptNameOrSourceURL() || '<anonymous>';
      if (filename === '<anonymous>') {
        filename = '';
      }
      if (callSite.isEval() && !filename) {
        const origin = callSite.getEvalOrigin();
        if (origin) {
          filename = origin.toString() + ', <anonymous>';
        }
      }
      const line = callSite.getLineNumber() || 0;
      const col = callSite.getColumnNumber() || 0;
      const enclosingLine: number =
        // $FlowFixMe[prop-missing]
        typeof callSite.getEnclosingLineNumber === 'function'
          ? (callSite: any).getEnclosingLineNumber() || 0
          : 0;
      const enclosingCol: number =
        // $FlowFixMe[prop-missing]
        typeof callSite.getEnclosingColumnNumber === 'function'
          ? (callSite: any).getEnclosingColumnNumber() || 0
          : 0;
      result.push([name, filename, line, col, enclosingLine, enclosingCol]);
    }
  }
  // At the same time we generate a string stack trace just in case someone
  // else reads it. Ideally, we'd call the previous prepareStackTrace to
  // ensure it's in the expected format but it's common for that to be
  // source mapped and since we do a lot of eager parsing of errors, it
  // would be slow in those environments. We could maybe just rely on those
  // environments having to disable source mapping globally to speed things up.
  // For now, we just generate a default V8 formatted stack trace without
  // source mapping as a fallback.
  const name = error.name || 'Error';
  const message = error.message || '';
  let stack = name + ': ' + message;
  for (let i = 0; i < structuredStackTrace.length; i++) {
    stack += '\n    at ' + structuredStackTrace[i].toString();
  }
  collectedStackTrace = result;
  return stack;
}

// This matches either of these V8 formats.
//     at name (filename:0:0)
//     at filename:0:0
//     at async filename:0:0
const frameRegExp =
  /^ {3} at (?:(.+) \((?:(.+):(\d+):(\d+)|\<anonymous\>)\)|(?:async )?(.+):(\d+):(\d+)|\<anonymous\>)$/;

export function parseStackTrace(
  error: Error,
  skipFrames: number,
): ReactStackTrace {
  // We override Error.prepareStackTrace with our own version that collects
  // the structured data. We need more information than the raw stack gives us
  // and we need to ensure that we don't get the source mapped version.
  collectedStackTrace = null;
  framesToSkip = skipFrames;
  const previousPrepare = Error.prepareStackTrace;
  Error.prepareStackTrace = collectStackTrace;
  let stack;
  try {
    // eslint-disable-next-line react-internal/safe-string-coercion
    stack = String(error.stack);
  } finally {
    Error.prepareStackTrace = previousPrepare;
  }

  if (collectedStackTrace !== null) {
    const result = collectedStackTrace;
    collectedStackTrace = null;
    return result;
  }

  // If the stack has already been read, or this is not actually a V8 compatible
  // engine then we might not get a normalized stack and it might still have been
  // source mapped. Regardless we try our best to parse it. This works best if the
  // environment just uses default V8 formatting and no source mapping.

  if (stack.startsWith('Error: react-stack-top-frame\n')) {
    // V8's default formatting prefixes with the error message which we
    // don't want/need.
    stack = stack.slice(29);
  }
  let idx = stack.indexOf('react-stack-bottom-frame');
  if (idx !== -1) {
    idx = stack.lastIndexOf('\n', idx);
  }
  if (idx !== -1) {
    // Cut off everything after the bottom frame since it'll be internals.
    stack = stack.slice(0, idx);
  }
  const frames = stack.split('\n');
  const parsedFrames: ReactStackTrace = [];
  // We skip top frames here since they may or may not be parseable but we
  // want to skip the same number of frames regardless. I.e. we can't do it
  // in the caller.
  for (let i = skipFrames; i < frames.length; i++) {
    const parsed = frameRegExp.exec(frames[i]);
    if (!parsed) {
      continue;
    }
    let name = parsed[1] || '';
    if (name === '<anonymous>') {
      name = '';
    }
    let filename = parsed[2] || parsed[5] || '';
    if (filename === '<anonymous>') {
      filename = '';
    }
    const line = +(parsed[3] || parsed[6]);
    const col = +(parsed[4] || parsed[7]);
    parsedFrames.push([name, filename, line, col, 0, 0]);
  }
  return parsedFrames;
}
