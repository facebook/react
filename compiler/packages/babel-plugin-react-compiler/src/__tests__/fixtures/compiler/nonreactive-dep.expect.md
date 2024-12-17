
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {makeObject_Primitives, print} from 'shared-runtime';

/**
 * Note that `obj` is currently added to the effect dependency array, even
 * though it's non-reactive due to memoization.
 *
 * This is a TODO in effect dependency inference. Note that we cannot simply
 * filter out non-reactive effect dependencies, as some non-reactive (by data
 * flow) values become reactive due to scope pruning. See the
 * `infer-effect-deps/pruned-nonreactive-obj` fixture for why this matters.
 *
 * Realizing that this `useEffect` should have an empty dependency array
 * requires effect dependency inference to be structured similarly to memo
 * dependency inference.
 * Pass 1: add all potential dependencies regardless of dataflow reactivity
 * Pass 2: (todo) prune non-reactive dependencies
 *
 * Note that instruction reordering should significantly reduce scope pruning
 */
function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  useEffect(() => print(obj));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect } from "react";
import { makeObject_Primitives, print } from "shared-runtime";

/**
 * Note that `obj` is currently added to the effect dependency array, even
 * though it's non-reactive due to memoization.
 *
 * This is a TODO in effect dependency inference. Note that we cannot simply
 * filter out non-reactive effect dependencies, as some non-reactive (by data
 * flow) values become reactive due to scope pruning. See the
 * `infer-effect-deps/pruned-nonreactive-obj` fixture for why this matters.
 *
 * Realizing that this `useEffect` should have an empty dependency array
 * requires effect dependency inference to be structured similarly to memo
 * dependency inference.
 * Pass 1: add all potential dependencies regardless of dataflow reactivity
 * Pass 2: (todo) prune non-reactive dependencies
 *
 * Note that instruction reordering should significantly reduce scope pruning
 */
function NonReactiveDepInEffect() {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeObject_Primitives();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const obj = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => print(obj);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t1, [obj]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented