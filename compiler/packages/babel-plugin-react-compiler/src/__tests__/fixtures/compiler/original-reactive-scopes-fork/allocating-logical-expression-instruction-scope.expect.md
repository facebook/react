
## Input

```javascript
// @enableReactiveScopesInHIR:false

/**
 * This is a weird case as data has type `BuiltInMixedReadonly`.
 * The only scoped value we currently infer in this program is the
 * PropertyLoad `data?.toString`.
 */
import {useFragment} from 'shared-runtime';

function Foo() {
  const data = useFragment();
  return [data?.toString() || ''];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveScopesInHIR:false

/**
 * This is a weird case as data has type `BuiltInMixedReadonly`.
 * The only scoped value we currently infer in this program is the
 * PropertyLoad `data?.toString`.
 */
import { useFragment } from "shared-runtime";

function Foo() {
  const $ = _c(2);
  const data = useFragment();
  const t0 = data?.toString() || "";
  let t1;
  if ($[0] !== t0) {
    t1 = [t0];
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
### Eval output
(kind: ok) ["[object Object]"]