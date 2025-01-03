
## Input

```javascript
import {makeObject_Primitives} from 'shared-runtime';

function Component(props) {
  const local = makeObject_Primitives();
  if (props.cond) {
    local.useFoo();
  }
}

```


## Error

```
  4 |   const local = makeObject_Primitives();
  5 |   if (props.cond) {
> 6 |     local.useFoo();
    |     ^^^^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (6:6)
  7 |   }
  8 | }
  9 |
```
          
      