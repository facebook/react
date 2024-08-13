
## Input

```javascript
// @enableReactiveScopesInHIR:false
import {useRef} from 'react';
import {addOne} from 'shared-runtime';

function useKeyCommand() {
  const currentPosition = useRef(0);
  const handleKey = direction => () => {
    const position = currentPosition.current;
    const nextPosition = direction === 'left' ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };
  const moveLeft = {
    handler: handleKey('left'),
  };
  const moveRight = {
    handler: handleKey('right'),
  };
  return [moveLeft, moveRight];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useKeyCommand,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveScopesInHIR:false
import { useRef } from "react";
import { addOne } from "shared-runtime";

function useKeyCommand() {
  const $ = _c(6);
  const currentPosition = useRef(0);
  const handleKey = (direction) => () => {
    const position = currentPosition.current;
    const nextPosition = direction === "left" ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { handler: handleKey("left") };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const moveLeft = t0;

  const t1 = handleKey("right");
  let t2;
  if ($[1] !== t1) {
    t2 = { handler: t1 };
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const moveRight = t2;
  let t3;
  if ($[3] !== moveLeft || $[4] !== moveRight) {
    t3 = [moveLeft, moveRight];
    $[3] = moveLeft;
    $[4] = moveRight;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useKeyCommand,
  params: [],
};

```
      
### Eval output
(kind: ok) [{"handler":"[[ function params=0 ]]"},{"handler":"[[ function params=0 ]]"}]