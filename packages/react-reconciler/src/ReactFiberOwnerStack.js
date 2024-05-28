/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_LAZY_TYPE} from 'shared/ReactSymbols';

import {
  callLazyInitInDEV,
  callComponentInDEV,
  callRenderInDEV,
} from './ReactFiberCallUserSpace';

// TODO: Make this configurable on the root.
const externalRegExp = /\/node\_modules\/|\(\<anonymous\>\)/;

let callComponentFrame: null | string = null;
let callIteratorFrame: null | string = null;
let callLazyInitFrame: null | string = null;

function isNotExternal(stackFrame: string): boolean {
  return !externalRegExp.test(stackFrame);
}

function initCallComponentFrame(): string {
  // Extract the stack frame of the callComponentInDEV function.
  const error = callComponentInDEV(Error, 'react-stack-top-frame', {});
  const stack = error.stack;
  const startIdx = stack.startsWith('Error: react-stack-top-frame\n') ? 29 : 0;
  const endIdx = stack.indexOf('\n', startIdx);
  if (endIdx === -1) {
    return stack.slice(startIdx);
  }
  return stack.slice(startIdx, endIdx);
}

function initCallRenderFrame(): string {
  // Extract the stack frame of the callRenderInDEV function.
  try {
    (callRenderInDEV: any)({render: null});
    return '';
  } catch (error) {
    const stack = error.stack;
    const startIdx = stack.startsWith('TypeError: ')
      ? stack.indexOf('\n') + 1
      : 0;
    const endIdx = stack.indexOf('\n', startIdx);
    if (endIdx === -1) {
      return stack.slice(startIdx);
    }
    return stack.slice(startIdx, endIdx);
  }
}

function initCallLazyInitFrame(): string {
  // Extract the stack frame of the callLazyInitInDEV function.
  const error = callLazyInitInDEV({
    $$typeof: REACT_LAZY_TYPE,
    _init: Error,
    _payload: 'react-stack-top-frame',
  });
  const stack = error.stack;
  const startIdx = stack.startsWith('Error: react-stack-top-frame\n') ? 29 : 0;
  const endIdx = stack.indexOf('\n', startIdx);
  if (endIdx === -1) {
    return stack.slice(startIdx);
  }
  return stack.slice(startIdx, endIdx);
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
  const frames = stack.split('\n').slice(1);
  if (callComponentFrame === null) {
    callComponentFrame = initCallComponentFrame();
  }
  let lastFrameIdx = frames.indexOf(callComponentFrame);
  if (lastFrameIdx === -1) {
    if (callLazyInitFrame === null) {
      callLazyInitFrame = initCallLazyInitFrame();
    }
    lastFrameIdx = frames.indexOf(callLazyInitFrame);
    if (lastFrameIdx === -1) {
      if (callIteratorFrame === null) {
        callIteratorFrame = initCallRenderFrame();
      }
      lastFrameIdx = frames.indexOf(callIteratorFrame);
    }
  }
  if (lastFrameIdx !== -1) {
    // Cut off everything after our "callComponent" slot since it'll be Fiber internals.
    frames.length = lastFrameIdx;
  }
  return frames.filter(isNotExternal).join('\n');
}

export function formatOwnerStack(ownerStackTrace: Error): string {
  return filterDebugStack(ownerStackTrace);
}
