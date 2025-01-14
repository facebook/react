
## Input

```javascript
import {identity} from 'shared-runtime';

function Foo() {
  const CONSTANT = 1;
  const x = {
    foo() {
      return identity(CONSTANT);
    },
  };
  return x.foo();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
import { identity } from "shared-runtime";

function Foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {
      foo() {
        return identity(1);
      },
    };

    t0 = x.foo();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 1