
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test optional chaining with method calls in both branches of a ternary
function Component(props: {
  a: {getX(): string} | null;
  b: {getY(): string} | null;
  cond: boolean;
}) {
  'use memo';
  const result = props.cond ? props.a?.getX() : props.b?.getY();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: true}],
  sequentialRenders: [
    {a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: true},
    {a: {getX: () => 'hello'}, b: {getY: () => 'world'}, cond: false},
    {a: null, b: {getY: () => 'world'}, cond: true},
    {a: {getX: () => 'hello'}, b: null, cond: false},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test optional chaining with method calls in both branches of a ternary
function Component(props) {
  "use memo";
  const $ = _c(6);
  let t0;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.cond) {
    t0 = props.cond ? props.a?.getX() : props.b?.getY();
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.cond;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const result = t0;
  let t1;
  if ($[4] !== result) {
    t1 = <Stringify value={result} />;
    $[4] = result;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      a: {
        getX: () => {
          return "hello";
        },
      },
      b: {
        getY: () => {
          return "world";
        },
      },
      cond: true,
    },
  ],
  sequentialRenders: [
    {
      a: {
        getX: () => {
          return "hello";
        },
      },
      b: {
        getY: () => {
          return "world";
        },
      },
      cond: true,
    },
    {
      a: {
        getX: () => {
          return "hello";
        },
      },
      b: {
        getY: () => {
          return "world";
        },
      },
      cond: false,
    },
    {
      a: null,
      b: {
        getY: () => {
          return "world";
        },
      },
      cond: true,
    },
    {
      a: {
        getX: () => {
          return "hello";
        },
      },
      b: null,
      cond: false,
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"hello"}</div>
<div>{"value":"world"}</div>
<div>{}</div>
<div>{}</div>