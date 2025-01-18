
## Input

```javascript
import {CONST_TRUE, Stringify, mutate, useIdentity} from 'shared-runtime';

/**
 * Fixture showing an edge case for ReactiveScope variable propagation.
 *
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   Forget:
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   [[ (exception in render) Error: invariant broken ]]
 *
 */
function Component() {
  const obj = CONST_TRUE ? {inner: {value: 'hello'}} : null;
  const boxedInner = [obj?.inner];
  useIdentity(null);
  mutate(obj);
  if (boxedInner[0] !== obj?.inner) {
    throw new Error('invariant broken');
  }
  return <Stringify obj={obj} inner={boxedInner} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arg: 0}],
  sequentialRenders: [{arg: 0}, {arg: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { CONST_TRUE, Stringify, mutate, useIdentity } from "shared-runtime";

/**
 * Fixture showing an edge case for ReactiveScope variable propagation.
 *
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   Forget:
 *   <div>{"obj":{"inner":{"value":"hello"},"wat0":"joe"},"inner":["[[ cyclic ref *2 ]]"]}</div>
 *   [[ (exception in render) Error: invariant broken ]]
 *
 */
function Component() {
  const $ = _c(4);
  const obj = CONST_TRUE ? { inner: { value: "hello" } } : null;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [obj?.inner];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const boxedInner = t0;
  useIdentity(null);
  mutate(obj);
  if (boxedInner[0] !== obj?.inner) {
    throw new Error("invariant broken");
  }
  let t1;
  if ($[1] !== boxedInner || $[2] !== obj) {
    t1 = <Stringify obj={obj} inner={boxedInner} />;
    $[1] = boxedInner;
    $[2] = obj;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ arg: 0 }],
  sequentialRenders: [{ arg: 0 }, { arg: 1 }],
};

```
      