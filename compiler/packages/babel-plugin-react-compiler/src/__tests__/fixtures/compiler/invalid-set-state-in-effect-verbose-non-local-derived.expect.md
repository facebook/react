
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @enableVerboseNoSetStateInEffect
import {useState, useEffect} from 'react';

function Child({firstName, lastName}) {
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);
  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Child,
  params: [{firstName: 'John', lastName: 'Doe'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInEffects @enableVerboseNoSetStateInEffect
import { useState, useEffect } from "react";

function Child(t0) {
  const $ = _c(6);
  const { firstName, lastName } = t0;
  const [fullName, setFullName] = useState("");
  let t1;
  let t2;
  if ($[0] !== firstName || $[1] !== lastName) {
    t1 = () => {
      setFullName(firstName + " " + lastName);
    };
    t2 = [firstName, lastName];
    $[0] = firstName;
    $[1] = lastName;
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
  fn: Child,
  params: [{ firstName: "John", lastName: "Doe" }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems. Calling setState synchronously causes cascading renders that hurt performance.\n\nThis pattern may indicate one of several issues:\n\n**1. Non-local derived data**: If the value being set could be computed from props/state but requires data from a parent component, consider restructuring state ownership so the derivation can happen during render in the component that owns the relevant state.\n\n**2. Derived event pattern**: If you're detecting when a prop changes (e.g., `isPlaying` transitioning from false to true), this often indicates the parent should provide an event callback (like `onPlay`) instead of just the current state. Request access to the original event.\n\n**3. Force update / external sync**: If you're forcing a re-render to sync with an external data source (mutable values outside React), use `useSyncExternalStore` to properly subscribe to external state changes.\n\nSee: https://react.dev/learn/you-might-not-need-an-effect","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":7,"column":4,"index":237},"end":{"line":7,"column":15,"index":248},"filename":"invalid-set-state-in-effect-verbose-non-local-derived.ts","identifierName":"setFullName"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":125},"end":{"line":10,"column":1,"index":340},"filename":"invalid-set-state-in-effect-verbose-non-local-derived.ts"},"fnName":"Child","memoSlots":6,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <div>John Doe</div>