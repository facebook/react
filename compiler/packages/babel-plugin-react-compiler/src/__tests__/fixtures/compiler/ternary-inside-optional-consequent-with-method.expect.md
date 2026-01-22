
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test ternary expression producing the value used in optional chaining with method call
function Component(props: {a: {getX(): string} | null; b: {getX(): string} | null; cond: boolean}) {
  'use memo';
  const obj = props.cond ? props.a : props.b;
  const result = obj?.getX();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: true}],
  sequentialRenders: [
    {a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: true},
    {a: {getX: () => 'a'}, b: {getX: () => 'b'}, cond: false},
    {a: null, b: {getX: () => 'b'}, cond: true},
    {a: {getX: () => 'a'}, b: null, cond: false},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test ternary expression producing the value used in optional chaining with method call
function Component(props) {
  "use memo";
  const $ = _c(4);

  const obj = props.cond ? props.a : props.b;
  let t0;
  if ($[0] !== obj) {
    t0 = obj?.getX();
    $[0] = obj;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const result = t0;
  let t1;
  if ($[2] !== result) {
    t1 = <Stringify value={result} />;
    $[2] = result;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      a: {
        getX: () => {
          return "a";
        },
      },
      b: {
        getX: () => {
          return "b";
        },
      },
      cond: true,
    },
  ],
  sequentialRenders: [
    {
      a: {
        getX: () => {
          return "a";
        },
      },
      b: {
        getX: () => {
          return "b";
        },
      },
      cond: true,
    },
    {
      a: {
        getX: () => {
          return "a";
        },
      },
      b: {
        getX: () => {
          return "b";
        },
      },
      cond: false,
    },
    {
      a: null,
      b: {
        getX: () => {
          return "b";
        },
      },
      cond: true,
    },
    {
      a: {
        getX: () => {
          return "a";
        },
      },
      b: null,
      cond: false,
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"a"}</div>
<div>{"value":"b"}</div>
<div>{}</div>
<div>{}</div>