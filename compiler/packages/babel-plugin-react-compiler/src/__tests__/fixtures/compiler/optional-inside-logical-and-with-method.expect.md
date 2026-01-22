
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test optional chaining inside logical AND (&&) with method calls
function Component(props: {value: {getX(): string} | null; enabled: boolean}) {
  'use memo';
  const value = props.value;
  const result = props.enabled && value?.getX();
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: {getX: () => 'hello'}, enabled: true}],
  sequentialRenders: [
    {value: {getX: () => 'hello'}, enabled: true},
    {value: {getX: () => 'hello'}, enabled: false},
    {value: null, enabled: true},
    {value: {getX: () => 'world'}, enabled: true},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test optional chaining inside logical AND (&&) with method calls
function Component(props) {
  "use memo";
  const $ = _c(5);

  const value = props.value;
  let t0;
  if ($[0] !== props.enabled || $[1] !== value) {
    t0 = props.enabled && value?.getX();
    $[0] = props.enabled;
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
  params: [
    {
      value: {
        getX: () => {
          return "hello";
        },
      },
      enabled: true,
    },
  ],
  sequentialRenders: [
    {
      value: {
        getX: () => {
          return "hello";
        },
      },
      enabled: true,
    },
    {
      value: {
        getX: () => {
          return "hello";
        },
      },
      enabled: false,
    },
    { value: null, enabled: true },
    {
      value: {
        getX: () => {
          return "world";
        },
      },
      enabled: true,
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"hello"}</div>
<div>{"value":false}</div>
<div>{}</div>
<div>{"value":"world"}</div>