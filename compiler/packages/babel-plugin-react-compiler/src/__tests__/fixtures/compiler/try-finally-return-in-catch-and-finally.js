import {throwErrorWithMessage} from 'shared-runtime';

/**
 * Test returning in catch and finally, with a throw in try.
 * Per JS semantics, the finally return overrides the catch return.
 */
function Component(props) {
  'use memo';
  try {
    throwErrorWithMessage(props.message);
    return props.tryValue; // never reached
  } catch {
    return props.catchValue;
  } finally {
    return props.finallyValue;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{message: 'error', tryValue: 'try', catchValue: 'catch', finallyValue: 'finally'}],
  sequentialRenders: [
    {message: 'err1', tryValue: 'try1', catchValue: 'catch1', finallyValue: 'finally1'},
    {message: 'err2', tryValue: 'try2', catchValue: 'catch2', finallyValue: 'finally2'},
    {message: 'err2', tryValue: 'try2', catchValue: 'catch2', finallyValue: 'finally2'}, // same props
    {message: 'err3', tryValue: 'try3', catchValue: 'catch3', finallyValue: 'finally3'},
  ],
};
