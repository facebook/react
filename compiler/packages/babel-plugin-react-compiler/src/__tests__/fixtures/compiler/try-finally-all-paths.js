import {throwErrorWithMessage} from 'shared-runtime';

/**
 * Comprehensive test covering all paths through try-catch-finally.
 * Tests:
 * 1. Try succeeds with return
 * 2. Try throws, catch returns
 * 3. Try throws, catch doesn't return, falls through
 * 4. Finally conditional return (overrides everything)
 */
function Component(props) {
  'use memo';
  try {
    if (props.shouldThrow) {
      throwErrorWithMessage(props.message);
    }
    return props.tryValue;
  } catch (e) {
    if (props.returnFromCatch) {
      return props.catchValue;
    }
  } finally {
    console.log('finally');
    if (props.returnFromFinally) {
      return props.finallyValue;
    }
  }
  return props.fallbackValue;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{
    shouldThrow: false,
    returnFromCatch: false,
    returnFromFinally: false,
    message: 'error',
    tryValue: 'try',
    catchValue: 'catch',
    finallyValue: 'finally',
    fallbackValue: 'fallback',
  }],
  sequentialRenders: [
    // Path 1: Try succeeds with return
    {shouldThrow: false, returnFromCatch: false, returnFromFinally: false,
      message: 'e', tryValue: 'try-success', catchValue: 'c', finallyValue: 'f', fallbackValue: 'fb'},
    // Path 2: Try throws, catch returns
    {shouldThrow: true, returnFromCatch: true, returnFromFinally: false,
      message: 'oops', tryValue: 't', catchValue: 'catch-return', finallyValue: 'f', fallbackValue: 'fb'},
    // Path 3: Try throws, catch doesn't return, falls through
    {shouldThrow: true, returnFromCatch: false, returnFromFinally: false,
      message: 'oops', tryValue: 't', catchValue: 'c', finallyValue: 'f', fallbackValue: 'fell-through'},
    // Path 4a: Finally return overrides try return
    {shouldThrow: false, returnFromCatch: false, returnFromFinally: true,
      message: 'e', tryValue: 'try-ignored', catchValue: 'c', finallyValue: 'finally-wins', fallbackValue: 'fb'},
    // Path 4b: Finally return overrides catch return
    {shouldThrow: true, returnFromCatch: true, returnFromFinally: true,
      message: 'oops', tryValue: 't', catchValue: 'catch-ignored', finallyValue: 'finally-wins-again', fallbackValue: 'fb'},
    // Path 4c: Finally return overrides fallthrough
    {shouldThrow: true, returnFromCatch: false, returnFromFinally: true,
      message: 'oops', tryValue: 't', catchValue: 'c', finallyValue: 'finally-overrides', fallbackValue: 'fb-ignored'},
    // Same as Path 1, verify memoization works
    {shouldThrow: false, returnFromCatch: false, returnFromFinally: false,
      message: 'e', tryValue: 'try-success', catchValue: 'c', finallyValue: 'f', fallbackValue: 'fb'},
  ],
};
