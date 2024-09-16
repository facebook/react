
## Input

```javascript
import {
  Stringify,
  makeObject_Primitives,
  mutate,
  mutateAndReturn,
} from 'shared-runtime';

function useFoo({data}) {
  let obj = null;
  let myDiv = null;
  label: {
    if (data.cond) {
      obj = makeObject_Primitives();
      if (data.cond1) {
        myDiv = <Stringify value={mutateAndReturn(obj)} />;
        break label;
      }
      mutate(obj);
    }
  }

  return myDiv;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{data: {cond: true, cond1: true}}],
  sequentialRenders: [
    {data: {cond: true, cond1: true}},
    {data: {cond: true, cond1: true}},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import {
  Stringify,
  makeObject_Primitives,
  mutate,
  mutateAndReturn,
} from "shared-runtime";

function useFoo(t0) {
  const $ = _c(3);
  const { data } = t0;
  let obj;
  let myDiv = null;
  bb0: if (data.cond) {
    if ($[0] !== data.cond1) {
      obj = makeObject_Primitives();
      if (data.cond1) {
        myDiv = <Stringify value={mutateAndReturn(obj)} />;
        break bb0;
      }

      mutate(obj);
      $[0] = data.cond1;
      $[1] = obj;
      $[2] = myDiv;
    } else {
      obj = $[1];
      myDiv = $[2];
    }
  }
  return myDiv;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ data: { cond: true, cond1: true } }],
  sequentialRenders: [
    { data: { cond: true, cond1: true } },
    { data: { cond: true, cond1: true } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"value":{"a":0,"b":"value1","c":true,"wat0":"joe"}}</div>
<div>{"value":{"a":0,"b":"value1","c":true,"wat0":"joe"}}</div>