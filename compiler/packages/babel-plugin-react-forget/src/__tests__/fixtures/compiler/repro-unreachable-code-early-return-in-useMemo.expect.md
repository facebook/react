
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useMemo, useState } from "react";
import { ValidateMemoization, identity } from "shared-runtime";

function Component({ value }) {
  const result = useMemo(() => {
    if (value == null) {
      return null;
    }
    try {
      return { value };
    } catch (e) {
      return null;
    }
  }, [value]);
  return <ValidateMemoization inputs={[value]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: null }],
  sequentialRenders: [
    { value: null },
    { value: null },
    { value: 42 },
    { value: 42 },
    { value: null },
    { value: 42 },
    { value: null },
    { value: 42 },
  ],
};

```

## Code

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import {
  useMemo,
  useState,
  unstable_useMemoCache as useMemoCache,
} from "react";
import { ValidateMemoization, identity } from "shared-runtime";

function Component(t0) {
  const $ = useMemoCache(10);
  const { value } = t0;
  let t1;
  bb13: {
    if (value == null) {
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = null;
        break bb13;
        $[0] = t1;
      } else {
        t1 = $[0];
      }
    }
    try {
      let t3;
      if ($[1] !== value) {
        t3 = { value };
        $[1] = value;
        $[2] = t3;
      } else {
        t3 = $[2];
      }
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = t3;
        $[3] = t1;
      } else {
        t1 = $[3];
      }
    } catch (t2) {
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = null;
        $[4] = t1;
      } else {
        t1 = $[4];
      }
    }
  }
  const result = t1;
  let t2;
  if ($[5] !== value) {
    t2 = [value];
    $[5] = value;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== t2 || $[8] !== result) {
    t3 = <ValidateMemoization inputs={t2} output={result} />;
    $[7] = t2;
    $[8] = result;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: null }],
  sequentialRenders: [
    { value: null },
    { value: null },
    { value: 42 },
    { value: 42 },
    { value: null },
    { value: 42 },
    { value: null },
    { value: 42 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[null],"output":"[[ cyclic ref *2 ]]"}</div>
<div>{"inputs":[null],"output":"[[ cyclic ref *2 ]]"}</div>
<div>{"inputs":[42],"output":{"value":42}}</div>
<div>{"inputs":[42],"output":{"value":42}}</div>
<div>{"inputs":[null],"output":"[[ cyclic ref *2 ]]"}</div>
<div>{"inputs":[42],"output":{"value":42}}</div>
<div>{"inputs":[null],"output":"[[ cyclic ref *2 ]]"}</div>
<div>{"inputs":[42],"output":{"value":42}}</div>