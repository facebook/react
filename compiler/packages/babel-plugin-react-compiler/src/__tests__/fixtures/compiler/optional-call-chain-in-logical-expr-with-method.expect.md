
## Input

```javascript
import {Stringify, useIdentity} from 'shared-runtime';

function useFoo(props: {value: {getX(): string; getY(): string} | null}) {
  'use memo';
  const value = props.value;
  const result = useIdentity({x: value?.getX(), y: value?.getY()}) ?? {};
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{value: null}],
  sequentialRenders: [
    {value: null},
    {value: {getX: () => 'x1', getY: () => 'y1'}},
    {value: {getX: () => 'x2', getY: () => 'y2'}},
    {value: null},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, useIdentity } from "shared-runtime";

function useFoo(props) {
  "use memo";
  const $ = _c(2);

  const value = props.value;
  const result = useIdentity({ x: value?.getX(), y: value?.getY() }) ?? {};
  let t0;
  if ($[0] !== result) {
    t0 = <Stringify value={result} />;
    $[0] = result;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: null }],
  sequentialRenders: [
    { value: null },
    {
      value: {
        getX: () => {
          return "x1";
        },
        getY: () => {
          return "y1";
        },
      },
    },
    {
      value: {
        getX: () => {
          return "x2";
        },
        getY: () => {
          return "y2";
        },
      },
    },
    { value: null },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":{}}</div>
<div>{"value":{"x":"x1","y":"y1"}}</div>
<div>{"value":{"x":"x2","y":"y2"}}</div>
<div>{"value":{}}</div>