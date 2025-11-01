
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import {useEffect, useState} from 'react';

export default function Component({props}) {
  const [fullName, setFullName] = useState(
    props.firstName + ' ' + props.lastName
  );

  useEffect(() => {
    setFullName(props.firstName + ' ' + props.lastName);
  }, [props.firstName, props.lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{props: {firstName: 'John', lastName: 'Doe'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp @loggerTestOnly
import { useEffect, useState } from "react";

export default function Component(t0) {
  const $ = _c(6);
  const { props } = t0;
  const [fullName, setFullName] = useState(
    props.firstName + " " + props.lastName,
  );
  let t1;
  let t2;
  if ($[0] !== props.firstName || $[1] !== props.lastName) {
    t1 = () => {
      setFullName(props.firstName + " " + props.lastName);
    };
    t2 = [props.firstName, props.lastName];
    $[0] = props.firstName;
    $[1] = props.lastName;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== fullName) {
    t3 = <div>{fullName}</div>;
    $[4] = fullName;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ props: { firstName: "John", lastName: "Doe" } }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"description":"Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user\n\nThis setState call is setting a derived value that depends on the following reactive sources:\n\nProps: [props]\n\nData Flow Tree:\n└── props (Prop)\n\nSee: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state","category":"EffectDerivationsOfState","reason":"You might not need an effect. Derive values in render, not effects.","details":[{"kind":"error","loc":{"start":{"line":10,"column":4,"index":269},"end":{"line":10,"column":15,"index":280},"filename":"invalid-derived-state-from-destructured-props.ts","identifierName":"setFullName"},"message":"This should be computed during render, not in an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":15,"index":122},"end":{"line":14,"column":1,"index":397},"filename":"invalid-derived-state-from-destructured-props.ts"},"fnName":"Component","memoSlots":6,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>John Doe</div>