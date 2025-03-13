
## Input

```javascript
// @gating
import * as React from 'react';

/**
 * Test that the correct `Foo` is printed
 */
let Foo = () => <div>hello world 1!</div>;
const MemoFoo = React.memo(Foo);
Foo = () => <div>hello world 2!</div>;

export const FIXTURE_ENTRYPOINT = {
  fn: () => <MemoFoo />,
  params: [],
};

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating
import * as React from "react";

/**
 * Test that the correct `Foo` is printed
 */
let Foo = isForgetEnabled_Fixtures()
  ? () => {
      const $ = _c(1);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <div>hello world 1!</div>;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
  : () => <div>hello world 1!</div>;
const MemoFoo = React.memo(Foo);
Foo = isForgetEnabled_Fixtures()
  ? () => {
      const $ = _c(1);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <div>hello world 2!</div>;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
  : () => <div>hello world 2!</div>;

export const FIXTURE_ENTRYPOINT = {
  fn: isForgetEnabled_Fixtures()
    ? () => {
        const $ = _c(1);
        let t0;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
          t0 = <MemoFoo />;
          $[0] = t0;
        } else {
          t0 = $[0];
        }
        return t0;
      }
    : () => <MemoFoo />,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>hello world 1!</div>