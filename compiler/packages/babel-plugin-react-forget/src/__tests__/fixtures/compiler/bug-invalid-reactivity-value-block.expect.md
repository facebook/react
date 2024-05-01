
## Input

```javascript
import {
  CONST_TRUE,
  identity,
  makeObject_Primitives,
  useNoAlias,
} from "shared-runtime";
/**
 * BUG
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   Forget:
 *   (kind: ok) [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   [[ (exception in render) Error: Oh no! ]]
 */

function Foo() {
  const obj = makeObject_Primitives();
  // hook calls keeps the next two lines as its own reactive scope
  useNoAlias();

  const shouldCaptureObj = obj != null && CONST_TRUE;
  const result = [shouldCaptureObj ? identity(obj) : null, obj];

  useNoAlias(result, obj);

  if (shouldCaptureObj && result[0] !== obj) {
    throw new Error("Unexpected");
  }
  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
import {
  CONST_TRUE,
  identity,
  makeObject_Primitives,
  useNoAlias,
} from "shared-runtime";
/**
 * BUG
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   Forget:
 *   (kind: ok) [{"a":0,"b":"value1","c":true},"[[ cyclic ref *1 ]]"]
 *   [[ (exception in render) Error: Oh no! ]]
 */

function Foo() {
  const $ = useMemoCache(1);
  const obj = makeObject_Primitives();

  useNoAlias();

  const shouldCaptureObj = obj != null && CONST_TRUE;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [shouldCaptureObj ? identity(obj) : null, obj];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const result = t0;

  useNoAlias(result, obj);
  if (shouldCaptureObj && result[0] !== obj) {
    throw new Error("Unexpected");
  }
  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```
      