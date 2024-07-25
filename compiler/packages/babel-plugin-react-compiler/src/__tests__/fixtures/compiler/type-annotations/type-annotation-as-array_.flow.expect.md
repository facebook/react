
## Input

```javascript
// @flow @enableUseTypeAnnotations
import {identity, makeArray} from 'shared-runtime';

function Component(props: {id: number}) {
  const x = (makeArray(props.id): Array<number>);
  const y = x.at(0);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{id: 42}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity, makeArray } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.id) {
    t0 = makeArray(props.id);
    $[0] = props.id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = (t0: Array<number>);
  let t1;
  if ($[2] !== x) {
    t1 = x.at(0);
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const y = t1;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ id: 42 }],
};

```
      
### Eval output
(kind: ok) 42