
## Input

```javascript
// @flow @gating
import { memo } from "react";

// TODO: this appears as a hoisted reference to Component, but it's a type not runtime reference!
type Props = React.ElementConfig<typeof Component>;

component Component(value: string) {
  return <div>{value}</div>;
}

export default memo<Props>(Component);

```


## Error

```
   5 | type Props = React.ElementConfig<typeof Component>;
   6 |
>  7 | component Component(value: string) {
     |           ^^^^^^^^^ Invariant: Encountered a function used before its declaration, which breaks Forget's gating codegen due to hoisting. Rewrite the reference to Component to not rely on hoisting to fix this issue (7:7)
   8 |   return <div>{value}</div>;
   9 | }
  10 |
```
          
      