
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @enableVerboseNoSetStateInEffect
import {useState, useEffect} from 'react';

function VideoPlayer({isPlaying}) {
  const [wasPlaying, setWasPlaying] = useState(isPlaying);
  useEffect(() => {
    if (isPlaying !== wasPlaying) {
      setWasPlaying(isPlaying);
      console.log('Play state changed!');
    }
  }, [isPlaying, wasPlaying]);
  return <video />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: VideoPlayer,
  params: [{isPlaying: true}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInEffects @enableVerboseNoSetStateInEffect
import { useState, useEffect } from "react";

function VideoPlayer(t0) {
  const $ = _c(5);
  const { isPlaying } = t0;
  const [wasPlaying, setWasPlaying] = useState(isPlaying);
  let t1;
  let t2;
  if ($[0] !== isPlaying || $[1] !== wasPlaying) {
    t1 = () => {
      if (isPlaying !== wasPlaying) {
        setWasPlaying(isPlaying);
        console.log("Play state changed!");
      }
    };

    t2 = [isPlaying, wasPlaying];
    $[0] = isPlaying;
    $[1] = wasPlaying;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <video />;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: VideoPlayer,
  params: [{ isPlaying: true }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems. Calling setState synchronously causes cascading renders that hurt performance.\n\nThis pattern may indicate one of several issues:\n\n**1. Non-local derived data**: If the value being set could be computed from props/state but requires data from a parent component, consider restructuring state ownership so the derivation can happen during render in the component that owns the relevant state.\n\n**2. Derived event pattern**: If you're detecting when a prop changes (e.g., `isPlaying` transitioning from false to true), this often indicates the parent should provide an event callback (like `onPlay`) instead of just the current state. Request access to the original event.\n\n**3. Force update / external sync**: If you're forcing a re-render to sync with an external data source (mutable values outside React), use `useSyncExternalStore` to properly subscribe to external state changes.\n\nSee: https://react.dev/learn/you-might-not-need-an-effect","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":8,"column":6,"index":282},"end":{"line":8,"column":19,"index":295},"filename":"invalid-set-state-in-effect-verbose-derived-event.ts","identifierName":"setWasPlaying"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":125},"end":{"line":13,"column":1,"index":408},"filename":"invalid-set-state-in-effect-verbose-derived-event.ts"},"fnName":"VideoPlayer","memoSlots":5,"memoBlocks":2,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: ok) <video></video>