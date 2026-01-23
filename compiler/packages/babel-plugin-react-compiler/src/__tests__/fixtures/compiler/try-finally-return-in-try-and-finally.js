/**
 * Test returning in both try and finally.
 * Per JS semantics, the finally return overrides the try return.
 */
function Component(props) {
  'use memo';
  try {
    return props.tryValue;
  } finally {
    return props.finallyValue;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{tryValue: 'try', finallyValue: 'finally'}],
  sequentialRenders: [
    {tryValue: 'try1', finallyValue: 'finally1'},
    {tryValue: 'try2', finallyValue: 'finally2'},
    {tryValue: 'try2', finallyValue: 'finally2'}, // same props, should reuse
    {tryValue: 'try3', finallyValue: 'finally3'},
  ],
};
