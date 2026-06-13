
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Correctness guard: When a closure is directly called during render,
 * it executes synchronously and its property accesses prove non-nullness.
 * The cache key should remain `obj.value` (non-optional). This fixture
 * must NOT change after the nullable-closure fix.
 */
function Component({obj}: {obj: {value: number}}) {
  const getValue = () => obj.value;
  const value = getValue();
  return <Stringify>{value}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: {value: 1}}],
  sequentialRenders: [{obj: {value: 1}}, {obj: {value: 2}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Correctness guard: When a closure is directly called during render,
 * it executes synchronously and its property accesses prove non-nullness.
 * The cache key should remain `obj.value` (non-optional). This fixture
 * must NOT change after the nullable-closure fix.
 */
function Component(t0) {
  const $ = _c(4);
  const { obj } = t0;
  let t1;
  if ($[0] !== obj.value) {
    const getValue = () => obj.value;
    t1 = getValue();
    $[0] = obj.value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const value = t1;
  let t2;
  if ($[2] !== value) {
    t2 = <Stringify>{value}</Stringify>;
    $[2] = value;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ obj: { value: 1 } }],
  sequentialRenders: [{ obj: { value: 1 } }, { obj: { value: 2 } }],
};

```
      
### Eval output
(kind: ok) <div>{"children":1}</div>
<div>{"children":2}</div>