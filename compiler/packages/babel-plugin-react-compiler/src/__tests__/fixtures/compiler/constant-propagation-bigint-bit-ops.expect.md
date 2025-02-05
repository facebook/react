
## Input

```javascript
import {Stringify} from 'shared-runtime';

function foo() {
  return (
    <Stringify
      value={[
        12n | 0n,
        12n & 0n,
        12n ^ 0n,
        12n | 3n,
        12n & 5n,
        12n ^ 7n,
        12n >> 0n,
        12n >> 1n,
        4n % 2n,
      ]}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Stringify value={[12n, 0n, 12n, 15n, 4n, 11n, 12n, 6n, 0n]} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: exception) Do not know how to serialize a BigInt