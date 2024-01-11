
## Input

```javascript
// @gating
import { memo } from "react";

export default memo(Foo);
function Foo() {}

```


## Error

```
[ReactForget] Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Foo to not rely on hoisting to fix this issue (5:5)
```
          
      