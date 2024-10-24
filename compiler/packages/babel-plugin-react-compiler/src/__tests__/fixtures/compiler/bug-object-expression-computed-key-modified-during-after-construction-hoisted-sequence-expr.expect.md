
## Input

```javascript
import {identity, mutate} from 'shared-runtime';

/**
 * Bug: copy of error.todo-object-expression-computed-key-modified-during-after-construction-sequence-expr
 * with the mutation hoisted to a named variable instead of being directly
 * inlined into the Object key.
 *
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   Forget:
 *   (kind: ok) [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe","wat2":"joe"}]
 */
function Component(props) {
  const key = {};
  const tmp = (mutate(key), key);
  const context = {
    // Here, `tmp` is frozen (as it's inferred to be a primitive/string)
    [tmp]: identity([props.value]),
  };
  mutate(key);
  return [context, key];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42}],
  sequentialRenders: [{value: 42}, {value: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity, mutate } from "shared-runtime";

/**
 * Bug: copy of error.todo-object-expression-computed-key-modified-during-after-construction-sequence-expr
 * with the mutation hoisted to a named variable instead of being directly
 * inlined into the Object key.
 *
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   Forget:
 *   (kind: ok) [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe"}]
 *   [{"[object Object]":[42]},{"wat0":"joe","wat1":"joe","wat2":"joe"}]
 */
function Component(props) {
  const $ = _c(8);
  let t0;
  let key;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    key = {};
    t0 = (mutate(key), key);
    $[0] = t0;
    $[1] = key;
  } else {
    t0 = $[0];
    key = $[1];
  }
  const tmp = t0;
  let t1;
  if ($[2] !== props.value) {
    t1 = identity([props.value]);
    $[2] = props.value;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== t1) {
    t2 = { [tmp]: t1 };
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const context = t2;

  mutate(key);
  let t3;
  if ($[6] !== context) {
    t3 = [context, key];
    $[6] = context;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  sequentialRenders: [{ value: 42 }, { value: 42 }],
};

```
      