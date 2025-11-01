
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function Component({propValue}) {
  const [value, setValue] = useState(null);

  function localFunction() {
    console.log('local function');
  }

  useEffect(() => {
    setValue(propValue);
    localFunction();
  }, [propValue]);

  return <div>{value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propValue: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(6);
  const { propValue } = t0;
  const [value, setValue] = useState(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function localFunction() {
      console.log("local function");
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const localFunction = t1;
  let t2;
  let t3;
  if ($[1] !== propValue) {
    t2 = () => {
      setValue(propValue);
      localFunction();
    };
    t3 = [propValue];
    $[1] = propValue;
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useEffect(t2, t3);
  let t4;
  if ($[4] !== value) {
    t4 = <div>{value}</div>;
    $[4] = value;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propValue: "test" }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nProps: [propValue]\n\nData Flow Tree:\n└── propValue (Prop)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":12,"column":4,"index":279},"end":{"line":12,"column":12,"index":287},"filename":"effect-contains-local-function-call.ts","identifierName":"setValue"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":17,"column":1,"index":371},"filename":"effect-contains-local-function-call.ts"},"fnName":"Component","memoSlots":6,"memoBlocks":3,"memoValues":4,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>test</div>
logs: ['local function']