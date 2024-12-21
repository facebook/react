
## Input

```javascript
// @gating @compilationMode(infer)
import React from 'react';
export default React.forwardRef(function notNamedLikeAComponent(props) {
  return <div />;
});

```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { c as _c } from "react/compiler-runtime"; // @gating @compilationMode(infer)
import React from "react";
export default React.forwardRef(
  isForgetEnabled_Fixtures()
    ? function notNamedLikeAComponent(props) {
        const $ = _c(1);
        let t0;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
          t0 = <div />;
          $[0] = t0;
        } else {
          t0 = $[0];
        }
        return t0;
      }
    : function notNamedLikeAComponent(props) {
        return <div />;
      },
);

```
      