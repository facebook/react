
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
import { makeArray } from "shared-runtime";

/**
 * This fixture tests what happens when a reactive has no declarations (other than an early return),
 * no reassignments, and no dependencies. In this case the only thing we can use to decide if we
 * should take the if or else branch is the early return declaration. But if that uses the same
 * sentinel as the memo cache sentinel, then if the previous execution did not early return it will
 * look like we didn't execute the memo block yet, and we'll needlessly re-execute instead of skipping
 * to the else branch.
 *
 * We have to use a distinct sentinel for the early return value.
 *
 * Here the fixture will always take the "else" branch and never early return, and we should see that
 * "recreate x" is only logged once, the first time we execute.
 */
let ENABLE_FEATURE = false;

function Component(props) {
  let x = [];
  console.log("recreate x");
  if (ENABLE_FEATURE) {
    x.push(42);
    console.log("early return");
    return x;
  } else {
    console.log("fallthrough");
  }
  return makeArray(props.a);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    { a: 42 },
    { a: 42 },
    { a: 3.14 },
    { a: 3.14 },
    { a: 42 },
    { a: 3.14 },
    { a: 42 },
    { a: 3.14 },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEarlyReturnInReactiveScopes
import { makeArray } from "shared-runtime";

/**
 * This fixture tests what happens when a reactive has no declarations (other than an early return),
 * no reassignments, and no dependencies. In this case the only thing we can use to decide if we
 * should take the if or else branch is the early return declaration. But if that uses the same
 * sentinel as the memo cache sentinel, then if the previous execution did not early return it will
 * look like we didn't execute the memo block yet, and we'll needlessly re-execute instead of skipping
 * to the else branch.
 *
 * We have to use a distinct sentinel for the early return value.
 *
 * Here the fixture will always take the "else" branch and never early return, and we should see that
 * "recreate x" is only logged once, the first time we execute.
 */
let ENABLE_FEATURE = false;

function Component(props) {
  const $ = useMemoCache(3);
  let t53;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t53 = Symbol.for("react.memo_cache_sentinel");
    bb8: {
      const x = [];
      console.log("recreate x");
      if (ENABLE_FEATURE) {
        x.push(42);
        console.log("early return");
        t53 = x;
        break bb8;
      }
    }
    $[0] = t53;
  } else {
    t53 = $[0];
  }
  if (t53 !== Symbol.for("react.memo_cache_sentinel")) {
    return t53;
  }

  console.log("fallthrough");
  let t0;
  if ($[1] !== props.a) {
    t0 = makeArray(props.a);
    $[1] = props.a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    { a: 42 },
    { a: 42 },
    { a: 3.14 },
    { a: 3.14 },
    { a: 42 },
    { a: 3.14 },
    { a: 42 },
    { a: 3.14 },
  ],
};

```
      
### Eval output
(kind: ok) [42]
[42]
[3.14]
[3.14]
[42]
[3.14]
[42]
[3.14]
logs: ['recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough','recreate x','fallthrough']