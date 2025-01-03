
## Input

```javascript
// @gating
import {memo} from 'react';

export default memo(Foo);
function Foo() {}

```


## Error

```
  3 |
  4 | export default memo(Foo);
> 5 | function Foo() {}
    |          ^^^ Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Foo to not rely on hoisting to fix this issue (5:5)
  6 |
```
          
      