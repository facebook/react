
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

/**
 * Special case of `infer-effect-deps/nonreactive-dep`.
 *
 * We know that local `useRef` return values are stable, regardless of
 * inferred memoization.
 */
function NonReactiveRefInEffect() {
  const ref = useRef('initial value');
  useEffect(() => print(ref.current));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useRef } from "react";
import { print } from "shared-runtime";

/**
 * Special case of `infer-effect-deps/nonreactive-dep`.
 *
 * We know that local `useRef` return values are stable, regardless of
 * inferred memoization.
 */
function NonReactiveRefInEffect() {
  const $ = _c(1);
  const ref = useRef("initial value");
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => print(ref.current);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(t0, []);
}

```
      
### Eval output
(kind: exception) Fixture not implemented