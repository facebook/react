
## Input

```javascript
// @gating
import { memo } from "react";

export default memo(Foo);
function Foo() {}

```


## Error

```
[ReactForget] InvalidConfig: Encountered Foo used before declaration which breaks Forget's gating codegen due to hoisting. Rewrite the reference to not use hoisting to fix this issue (5:5)
```
          
      