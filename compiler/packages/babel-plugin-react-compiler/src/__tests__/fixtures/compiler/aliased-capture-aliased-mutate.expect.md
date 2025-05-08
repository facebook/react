
## Input

```javascript
// @flow @enableTransitivelyFreezeFunctionExpressions:false
import {arrayPush, setPropertyByKey, Stringify} from 'shared-runtime';

function useFoo({a, b}: {a: number, b: number}) {
  const x = [];
  const y = {value: a};

  arrayPush(x, y); // x and y co-mutate
  const y_alias = y;
  const cb = () => y_alias.value;
  setPropertyByKey(x[0], 'value', b); // might overwrite y.value
  return <Stringify cb={cb} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2, b: 10}],
  sequentialRenders: [
    {a: 2, b: 10},
    {a: 2, b: 11},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { arrayPush, setPropertyByKey, Stringify } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(3);
  const { a, b } = t0;
  let t1;
  if ($[0] !== a || $[1] !== b) {
    const x = [];
    const y = { value: a };

    arrayPush(x, y);
    const y_alias = y;
    const cb = () => y_alias.value;
    setPropertyByKey(x[0], "value", b);
    t1 = <Stringify cb={cb} shouldInvokeFns={true} />;
    $[0] = a;
    $[1] = b;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: 2, b: 10 }],
  sequentialRenders: [
    { a: 2, b: 10 },
    { a: 2, b: 11 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"cb":{"kind":"Function","result":10},"shouldInvokeFns":true}</div>
<div>{"cb":{"kind":"Function","result":11},"shouldInvokeFns":true}</div>