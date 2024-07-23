
## Input

```javascript
import fbt from 'fbt';

/**
 * Forget + fbt inconsistency. Evaluator errors with the following
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) 1 rewrite to Rust · 2 months traveling
 *   Forget:
 *   (kind: ok) 1 rewrites to Rust · 2 months traveling
 */
function Foo({rewrites, months}) {
  return (
    <fbt desc="Test fbt description">
      <fbt:plural count={rewrites} name="number of rewrites" showCount="yes">
        rewrite
      </fbt:plural>
      to Rust ·
      <fbt:plural count={months} name="number of months" showCount="yes">
        month
      </fbt:plural>
      traveling
    </fbt>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{rewrites: 1, months: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import fbt from "fbt";

/**
 * Forget + fbt inconsistency. Evaluator errors with the following
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) 1 rewrite to Rust · 2 months traveling
 *   Forget:
 *   (kind: ok) 1 rewrites to Rust · 2 months traveling
 */
function Foo(t0) {
  const $ = _c(3);
  const { rewrites, months } = t0;
  let t1;
  if ($[0] !== rewrites || $[1] !== months) {
    t1 = fbt._(
      {
        "*": {
          "*": "{number of rewrites} rewrites to Rust · {number of months} months traveling",
        },
        _1: { _1: "1 rewrite to Rust · 1 month traveling" },
      },
      [
        fbt._plural(rewrites, "number of rewrites"),
        fbt._plural(months, "number of months"),
      ],
      { hk: "49MfZA" },
    );
    $[0] = rewrites;
    $[1] = months;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ rewrites: 1, months: 2 }],
};

```
      