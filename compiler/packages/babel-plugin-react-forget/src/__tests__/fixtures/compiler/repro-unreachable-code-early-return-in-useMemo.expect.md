
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useMemo, useState } from "react";
import { Stringify, identity } from "shared-runtime";

function Component({ value }) {
  "use no forget";
  const result = useValue(value);
  return <Validate inputs={[value]} output={result} />;
}

function Validate({ inputs, output }) {
  "use no forget";
  const [previousInputs, setPreviousInputs] = useState(inputs);
  const [previousOutput, setPreviousOutput] = useState(output);
  if (
    inputs.length !== previousInputs.length ||
    inputs.some((item, i) => item !== previousInputs[i])
  ) {
    // Some input changed, we expect the output to change
    setPreviousInputs(inputs);
    setPreviousOutput(output);
  } else if (output !== previousOutput) {
    // Else output should be stable
    throw new Error("Output identity changed but inputs did not");
  }
  return <Stringify inputs={inputs} output={output} />;
}

function useValue(value) {
  return useMemo(() => {
    if (value == null) {
      return null;
    }
    try {
      return { value };
    } catch (e) {
      return null;
    }
  }, [value]);
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
import { Stringify, identity } from "shared-runtime";

function Component({ value }) {
  "use no forget";
  const result = useValue(value);
  return <Validate inputs={[value]} output={result} />;
}

function Validate({ inputs, output }) {
  "use no forget";
  const [previousInputs, setPreviousInputs] = useState(inputs);
  const [previousOutput, setPreviousOutput] = useState(output);
  if (
    inputs.length !== previousInputs.length ||
    inputs.some((item, i) => item !== previousInputs[i])
  ) {
    // Some input changed, we expect the output to change
    setPreviousInputs(inputs);
    setPreviousOutput(output);
  } else if (output !== previousOutput) {
    // Else output should be stable
    throw new Error("Output identity changed but inputs did not");
  }
  return <Stringify inputs={inputs} output={output} />;
}

function useValue(value) {
  const $ = useMemoCache(5);
  let t0;
  bb13: {
    if (value == null) {
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = null;
        break bb13;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
    }
    try {
      let t2;
      if ($[1] !== value) {
        t2 = { value };
        $[1] = value;
        $[2] = t2;
      } else {
        t2 = $[2];
      }
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = t2;
        $[3] = t0;
      } else {
        t0 = $[3];
      }
    } catch (t1) {
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = null;
        $[4] = t0;
      } else {
        t0 = $[4];
      }
    }
  }
  return t0;
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