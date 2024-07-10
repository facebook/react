
## Input

```javascript
import { useRef } from "react";
import { addOne } from "shared-runtime";

function useKeyCommand() {
  const currentPosition = useRef(0);
  const handleKey = (direction) => () => {
    const position = currentPosition.current;
    const nextPosition = direction === "left" ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };
  const moveLeft = {
    handler: handleKey("left"),
  };
  const moveRight = {
    handler: handleKey("right"),
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
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";
import { addOne } from "shared-runtime";

function useKeyCommand() {
  const $ = _c(2);
  const currentPosition = useRef(0);
  const handleKey = (direction) => () => {
    const position = currentPosition.current;
    const nextPosition = direction === "left" ? addOne(position) : position;
    currentPosition.current = nextPosition;
  };

  const moveLeft = { handler: handleKey("left") };

  const t0 = handleKey("right");
  let t1;
  if ($[0] !== t0) {
    t1 = { handler: t0 };
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const moveRight = t1;
  return [moveLeft, moveRight];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useKeyCommand,
  params: [],
};

```
      
### Eval output
(kind: ok) [{"handler":"[[ function params=0 ]]"},{"handler":"[[ function params=0 ]]"}]