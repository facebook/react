
## Input

```javascript
import {useMemo} from 'react';

function Component(props) {
  const outerHandlers = useMemo(() => {
    let handlers = {value: props.value};
    switch (props.test) {
      case true: {
        console.log(handlers.value);
        break;
      }
      default: {
      }
    }
    return handlers;
  });
  return outerHandlers;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: true, value: 'hello'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";

function Component(props) {
  const $ = _c(2);
  let t0;
  let t1;
  if ($[0] !== props.value) {
    t1 = { value: props.value };
    $[0] = props.value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handlers = t1;
  bb0: switch (props.test) {
    case true: {
      console.log(handlers.value);
      break bb0;
    }
    default: {
    }
  }

  t0 = handlers;
  const outerHandlers = t0;
  return outerHandlers;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ test: true, value: "hello" }],
};

```
      
### Eval output
(kind: ok) {"value":"hello"}
logs: ['hello']