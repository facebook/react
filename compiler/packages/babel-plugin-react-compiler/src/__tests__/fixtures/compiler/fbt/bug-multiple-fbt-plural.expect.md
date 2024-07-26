
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
 *
 * The root issue here is that fbt:plural reads `.start` and `.end` from
 * babel nodes to slice into source strings. (fbt:enum suffers from the same
 * problem).
 * See:
 *  - [getRawSource](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/FbtUtil.js#L666-L673)
 *  - [getArgCode](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/fbt-nodes/FbtArguments.js#L88-L97)
 *  - [_getStringVariationCombinations](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/JSFbtBuilder.js#L297)
 *
 * Specifically, the `count` node requires that a `.start/.end` be attached
 * (see [code in FbtPluralNode](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/fbt-nodes/FbtPluralNode.js#L87-L90))
 *
 * In this fixture, `count` nodes are the `rewrites` and `months` identifiers.
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
 *
 * The root issue here is that fbt:plural reads `.start` and `.end` from
 * babel nodes to slice into source strings. (fbt:enum suffers from the same
 * problem).
 * See:
 *  - [getRawSource](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/FbtUtil.js#L666-L673)
 *  - [getArgCode](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/fbt-nodes/FbtArguments.js#L88-L97)
 *  - [_getStringVariationCombinations](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/JSFbtBuilder.js#L297)
 *
 * Specifically, the `count` node requires that a `.start/.end` be attached
 * (see [code in FbtPluralNode](https://github.com/facebook/fbt/blob/main/packages/babel-plugin-fbt/src/fbt-nodes/FbtPluralNode.js#L87-L90))
 *
 * In this fixture, `count` nodes are the `rewrites` and `months` identifiers.
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
      