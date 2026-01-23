
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test optional chaining inside logical OR (||) with method calls
function Component(props: {value: {getX(): string} | null; fallback: string}) {
  'use memo';
  const value = props.value;
  const result = value?.getX() || props.fallback;
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: null, fallback: 'default'}],
  sequentialRenders: [
    {value: null, fallback: 'default'},
    {value: {getX: () => 'hello'}, fallback: 'default'},
    {value: {getX: () => ''}, fallback: 'default'},
    {value: null, fallback: 'other'},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test optional chaining inside logical OR (||) with method calls
function Component(props) {
  "use memo";
  const $ = _c(5);

  const value = props.value;
  let t0;
  if ($[0] !== props.fallback || $[1] !== value) {
    t0 = value?.getX() || props.fallback;
    $[0] = props.fallback;
    $[1] = value;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const result = t0;
  let t1;
  if ($[3] !== result) {
    t1 = <Stringify value={result} />;
    $[3] = result;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: null, fallback: "default" }],
  sequentialRenders: [
    { value: null, fallback: "default" },
    {
      value: {
        getX: () => {
          return "hello";
        },
      },
      fallback: "default",
    },
    {
      value: {
        getX: () => {
          return "";
        },
      },
      fallback: "default",
    },
    { value: null, fallback: "other" },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"default"}</div>
<div>{"value":"hello"}</div>
<div>{"value":"default"}</div>
<div>{"value":"other"}</div>