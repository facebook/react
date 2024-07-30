
## Input

```javascript
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

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, identity, useIdentity } from "shared-runtime";

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
function Foo(t0) {
  const $ = _c(9);
  const x = {};
  const y = {};
  useIdentity(0);

  const t1 = Stringify;
  const t2 = identity(y);
  let t3;
  if ($[0] !== t1 || $[1] !== t2) {
    t3 = <t1 value={t2} />;
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const T0 = Stringify;
  const t4 = identity(x);
  let t5;
  if ($[3] !== T0 || $[4] !== t4) {
    t5 = <T0 value={t4} />;
    $[3] = T0;
    $[4] = t4;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  let t6;
  if ($[6] !== t3 || $[7] !== t5) {
    t6 = (
      <>
        {t3}
        {t5}
      </>
    );
    $[6] = t3;
    $[7] = t5;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      