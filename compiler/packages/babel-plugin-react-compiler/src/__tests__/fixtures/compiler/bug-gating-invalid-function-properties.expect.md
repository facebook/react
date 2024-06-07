
## Input

```javascript
// @gating

/**
 * Fail: bug-gating-invalid-function-properties
 *   Unexpected error in Forget runner
 *   Component is not defined
 */
export default function Component() {
  return <></>;
}

export function Component2() {
  return <></>;
}

Component.displayName = "Component ONE";
Component2.displayName = "Component TWO";

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [],
};

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating

/**
 * Fail: bug-gating-invalid-function-properties
 *   Unexpected error in Forget runner
 *   Component is not defined
 */
export default isForgetEnabled_Fixtures()
  ? function Component() {
      const $ = _c(1);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <></>;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
  : function Component() {
      return <></>;
    };

export const Component2 = isForgetEnabled_Fixtures()
  ? function Component2() {
      const $ = _c(1);
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <></>;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
  : function Component2() {
      return <></>;
    };

Component.displayName = "Component ONE";
Component2.displayName = "Component TWO";

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [],
};

```
      