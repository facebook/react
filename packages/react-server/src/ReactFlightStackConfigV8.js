/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactStackTrace} from 'shared/ReactTypes';

function prepareStackTrace(
  error: Error,
  structuredStackTrace: CallSite[],
): string {
  const name = error.name || 'Error';
  const message = error.message || '';
  let stack = name + ': ' + message;
  for (let i = 0; i < structuredStackTrace.length; i++) {
    stack += '\n    at ' + structuredStackTrace[i].toString();
  }
  return stack;
}

function getStack(error: Error): string {
  // We override Error.prepareStackTrace with our own version that normalizes
  // the stack to V8 formatting even if the server uses other formatting.
  // It also ensures that source maps are NOT applied to this since that can
  // be slow we're better off doing that lazily from the client instead of
  // eagerly on the server. If the stack has already been read, then we might
  // not get a normalized stack and it might still have been source mapped.
  const previousPrepare = Error.prepareStackTrace;
  Error.prepareStackTrace = prepareStackTrace;
  try {
    // eslint-disable-next-line react-internal/safe-string-coercion
    return String(error.stack);
  } finally {
    Error.prepareStackTrace = previousPrepare;
  }
}

// This matches either of these V8 formats.
//     at name (filename:0:0)
//     at filename:0:0
//     at async filename:0:0
const frameRegExp =
  /^ {3} at (?:(.+) \((.+):(\d+):(\d+)\)|(?:async )?(.+):(\d+):(\d+))$/;

export function parseStackTrace(
  error: Error,
  skipFrames: number,
): ReactStackTrace {
  let stack = getStack(error);
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
    parsedFrames.push([name, filename, line, col]);
  }
  return parsedFrames;
}
