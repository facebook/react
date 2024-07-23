/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// TODO: Make this configurable on the Request.
const externalRegExp = /\/node\_modules\/| \(node\:| node\:|\(\<anonymous\>/;

function isNotExternal(stackFrame: string): boolean {
  return !externalRegExp.test(stackFrame);
}

function filterDebugStack(error: Error): string {
  // Since stacks can be quite large and we pass a lot of them, we filter them out eagerly
  // to save bandwidth even in DEV. We'll also replay these stacks on the client so by
  // stripping them early we avoid that overhead. Otherwise we'd normally just rely on
  // the DevTools or framework's ignore lists to filter them out.
  let stack = error.stack;
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
  const frames = stack.split('\n').slice(1); // Pop the JSX frame.
  return frames.filter(isNotExternal).join('\n');
}

export function formatOwnerStack(ownerStackTrace: Error): string {
  return filterDebugStack(ownerStackTrace);
}
