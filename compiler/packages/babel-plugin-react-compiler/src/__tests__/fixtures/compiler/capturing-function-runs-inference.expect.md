
## Input

```javascript
import {Stringify} from 'shared-runtime';
function Component({a, b}) {
  let z = {a};
  let p = () => <Stringify>{z}</Stringify>;
  return p();
}
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 1}],
  sequentialRenders: [{a: 1}, {a: 1}, {a: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";
function Component(t0) {
  const $ = _c(6);
  const { a } = t0;
  let t1;
  if ($[0] !== a) {
    t1 = { a };
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const z = t1;
  let t2;
  if ($[2] !== z) {
    t2 = () => <Stringify>{z}</Stringify>;
    $[2] = z;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const p = t2;
  let t3;
  if ($[4] !== p) {
    t3 = p();
    $[4] = p;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1 }],
  sequentialRenders: [{ a: 1 }, { a: 1 }, { a: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"children":{"a":1}}</div>
<div>{"children":{"a":1}}</div>
<div>{"children":{"a":2}}</div>