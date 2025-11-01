
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

function Component() {
  const [firstName, setFirstName] = useState('Taylor');
  const lastName = 'Swift';

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

function Component() {
  const $ = _c(5);
  const [firstName] = useState("Taylor");

  const [fullName, setFullName] = useState("");
  let t0;
  let t1;
  if ($[0] !== firstName) {
    t0 = () => {
      setFullName(firstName + " " + "Swift");
    };
    t1 = [firstName, "Swift"];
    $[0] = firstName;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  let t2;
  if ($[3] !== fullName) {
    t2 = <div>{fullName}</div>;
    $[3] = fullName;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nState: [firstName]\n\nData Flow Tree:\n└── firstName (State)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":11,"column":4,"index":341},"end":{"line":11,"column":15,"index":352},"filename":"invalid-derived-computation-in-effect.ts","identifierName":"setFullName"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":107},"end":{"line":15,"column":1,"index":445},"filename":"invalid-derived-computation-in-effect.ts"},"fnName":"Component","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>Taylor Swift</div>