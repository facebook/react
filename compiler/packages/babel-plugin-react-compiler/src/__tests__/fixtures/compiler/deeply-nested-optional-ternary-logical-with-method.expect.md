
## Input

```javascript
import {Stringify} from 'shared-runtime';

// Test deeply nested: optional in ternary condition with logical fallback using method calls
function Component(props: {
  value: {getFlag(): boolean; getData(): string} | null;
  fallback: string;
}) {
  'use memo';
  const value = props.value;
  const result = (value?.getFlag() ? value?.getData() : null) ?? props.fallback;
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      value: {getFlag: () => true, getData: () => 'success'},
      fallback: 'default',
    },
  ],
  sequentialRenders: [
    {
      value: {getFlag: () => true, getData: () => 'success'},
      fallback: 'default',
    },
    {
      value: {getFlag: () => false, getData: () => 'success'},
      fallback: 'default',
    },
    {value: null, fallback: 'default'},
    {value: {getFlag: () => true, getData: () => 'other'}, fallback: 'default'},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

// Test deeply nested: optional in ternary condition with logical fallback using method calls
function Component(props) {
  "use memo";
  const $ = _c(5);

  const value = props.value;
  let t0;
  if ($[0] !== props.fallback || $[1] !== value) {
    t0 = (value?.getFlag() ? value?.getData() : null) ?? props.fallback;
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
  params: [
    {
      value: {
        getFlag: () => {
          return true;
        },
        getData: () => {
          return "success";
        },
      },
      fallback: "default",
    },
  ],

  sequentialRenders: [
    {
      value: {
        getFlag: () => {
          return true;
        },
        getData: () => {
          return "success";
        },
      },
      fallback: "default",
    },
    {
      value: {
        getFlag: () => {
          return false;
        },
        getData: () => {
          return "success";
        },
      },
      fallback: "default",
    },
    { value: null, fallback: "default" },
    {
      value: {
        getFlag: () => {
          return true;
        },
        getData: () => {
          return "other";
        },
      },
      fallback: "default",
    },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":"success"}</div>
<div>{"value":"default"}</div>
<div>{"value":"default"}</div>
<div>{"value":"other"}</div>