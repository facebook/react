
## Input

```javascript
import {mutateAndReturn, Stringify, useIdentity} from 'shared-runtime';

function Component({value}) {
  const arr = [{value: 'foo'}, {value: 'bar'}, {value}];
  useIdentity();
  const derived = Array.from(arr, mutateAndReturn);
  return <Stringify>{derived.at(-1)}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
  sequentialRenders: [{value: 5}, {value: 6}, {value: 6}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { mutateAndReturn, Stringify, useIdentity } from "shared-runtime";

function Component(t0) {
  const $ = _c(4);
  const { value } = t0;
  const arr = [{ value: "foo" }, { value: "bar" }, { value }];
  useIdentity();
  const derived = Array.from(arr, mutateAndReturn);
  let t1;
  if ($[0] !== derived) {
    t1 = derived.at(-1);
    $[0] = derived;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = <Stringify>{t1}</Stringify>;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 5 }],
  sequentialRenders: [{ value: 5 }, { value: 6 }, { value: 6 }],
};

```
      
### Eval output
(kind: ok) <div>{"children":{"value":5,"wat0":"joe"}}</div>
<div>{"children":{"value":6,"wat0":"joe"}}</div>
<div>{"children":{"value":6,"wat0":"joe"}}</div>