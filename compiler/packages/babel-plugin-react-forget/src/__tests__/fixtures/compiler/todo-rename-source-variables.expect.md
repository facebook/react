
## Input

```javascript
import { identity } from "shared-runtime";

const $ = "module_$";
const t0 = "module_t0";
const c_0 = "module_c_0";
function useFoo(props: { value: number }): number {
  const results = identity(props.value);
  console.log($);
  console.log(t0);
  console.log(c_0);
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 0 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

const $ = "module_$";
const t0 = "module_t0";
const c_0 = "module_c_0";
function useFoo(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.value) {
    t0 = identity(props.value);
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const results = t0;
  console.log($);
  console.log(t0);
  console.log(c_0);
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 0 }],
};

```
      