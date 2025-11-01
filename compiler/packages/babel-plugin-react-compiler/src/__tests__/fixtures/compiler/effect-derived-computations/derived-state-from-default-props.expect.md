
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

export default function Component({input = 'empty'}) {
  const [currInput, setCurrInput] = useState(input);
  const localConst = 'local const';

  useEffect(() => {
    setCurrInput(input + localConst);
  }, [input, localConst]);

  return <div>{currInput}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{input: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

export default function Component(t0) {
  const $ = _c(5);
  const { input: t1 } = t0;
  const input = t1 === undefined ? "empty" : t1;
  const [currInput, setCurrInput] = useState(input);
  let t2;
  let t3;
  if ($[0] !== input) {
    t2 = () => {
      setCurrInput(input + "local const");
    };
    t3 = [input, "local const"];
    $[0] = input;
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  useEffect(t2, t3);
  let t4;
  if ($[3] !== currInput) {
    t4 = <div>{currInput}</div>;
    $[3] = currInput;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ input: "test" }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nProps: [input]\n\nData Flow Tree:\n└── input (Prop)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":9,"column":4,"index":276},"end":{"line":9,"column":16,"index":288},"filename":"derived-state-from-default-props.ts","identifierName":"setCurrInput"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":15,"index":122},"end":{"line":13,"column":1,"index":372},"filename":"derived-state-from-default-props.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>testlocal const</div>