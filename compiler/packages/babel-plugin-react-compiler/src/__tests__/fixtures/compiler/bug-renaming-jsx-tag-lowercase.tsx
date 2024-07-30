import {Stringify, identity, useIdentity} from 'shared-runtime';

/**
 * Currently, we're passing a lower-case jsx tag `t0`.
 * We should either reorder Stringify or rename the local to `T0`.
 *
 * See evaluator error:
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div>{"value":{}}</div><div>{"value":{}}</div>
 *   Forget:
 *   (kind: ok) <t1 value="[object Object]"></t1><div>{"value":{}}</div>
 *   logs: ['Warning: The tag <%s> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.%s','t1']
 */
function Foo({}) {
  const x = {};
  const y = {};
  useIdentity(0);
  return (
    <>
      <Stringify value={identity(y)} />
      <Stringify value={identity(x)} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};
