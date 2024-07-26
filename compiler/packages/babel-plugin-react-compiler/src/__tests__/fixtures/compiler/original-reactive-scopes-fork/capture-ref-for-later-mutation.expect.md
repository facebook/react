
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
  const $ = _c(7);
  const currentPosition = useRef(0);
  const handleKey = (direction) => () => {
    const position = currentPosition.current;
    const nextPosition = direction === "left" ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };

  const t0 = handleKey("left");
  let t1;
  if ($[0] !== t0) {
    t1 = { handler: t0 };
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const moveLeft = t1;

  const t2 = handleKey("right");
  let t3;
  if ($[2] !== t2) {
    t3 = { handler: t2 };
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const moveRight = t3;
  let t4;
  if ($[4] !== moveLeft || $[5] !== moveRight) {
    t4 = [moveLeft, moveRight];
    $[4] = moveLeft;
    $[5] = moveRight;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useKeyCommand,
  params: [],
};

```
      
### Eval output
(kind: ok) [{"handler":"[[ function params=0 ]]"},{"handler":"[[ function params=0 ]]"}]