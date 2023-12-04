
## Input

```javascript
import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  const local = makeObject_Primitives();
  if (props.cond) {
    const foo = local.useFoo;
    foo();
  }
}

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)
```
          
      