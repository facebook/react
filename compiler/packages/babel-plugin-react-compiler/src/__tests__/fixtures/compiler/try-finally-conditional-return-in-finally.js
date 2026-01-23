/**
 * Test conditional return in finally block.
 * When returnFromFinally is true, returns from finally (overriding any try return).
 * When returnFromFinally is false, the try return takes effect.
 */
function Component(props) {
  'use memo';
  try {
    return props.tryValue;
  } finally {
    console.log('finally');
    if (props.returnFromFinally) {
      return props.finallyValue;
    }
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{tryValue: 'try', returnFromFinally: true, finallyValue: 'finally'}],
  sequentialRenders: [
    // Finally returns - overrides try return
    {tryValue: 'try1', returnFromFinally: true, finallyValue: 'finally1'},
    // Finally doesn't return - try return takes effect
    {tryValue: 'try2', returnFromFinally: false, finallyValue: 'ignored'},
    // Same as previous
    {tryValue: 'try2', returnFromFinally: false, finallyValue: 'ignored'},
    // Finally returns again
    {tryValue: 'try3', returnFromFinally: true, finallyValue: 'finally3'},
    // Finally doesn't return
    {tryValue: 'try4', returnFromFinally: false, finallyValue: 'ignored'},
  ],
};
