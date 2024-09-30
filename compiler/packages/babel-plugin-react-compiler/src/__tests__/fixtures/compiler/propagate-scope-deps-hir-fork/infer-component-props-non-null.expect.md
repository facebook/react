
## Input

```javascript
// @enablePropagateDepsInHIR
import {identity, Stringify} from 'shared-runtime';

function Foo(props) {
  /**
   * props.value should be inferred as the dependency of this scope
   * since we know that props is safe to read from (i.e. non-null)
   * as it is arg[0] of a component function
   */
  const arr = [];
  if (cond) {
    arr.push(identity(props.value));
  }
  return <Stringify arr={arr} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{value: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR
import { identity, Stringify } from "shared-runtime";

function Foo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.value) {
    const arr = [];
    if (cond) {
      arr.push(identity(props.value));
    }

    t0 = <Stringify arr={arr} />;
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ value: 2 }],
};

```
      
### Eval output
(kind: exception) cond is not defined