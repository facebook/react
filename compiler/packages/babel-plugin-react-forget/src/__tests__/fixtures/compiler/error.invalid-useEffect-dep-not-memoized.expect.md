
## Input

```javascript
// @validateMemoizedEffectDependencies
import { useEffect } from "react";

function Component(props) {
  const data = {};
  useEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}

```


## Error

```
   4 | function Component(props) {
   5 |   const data = {};
>  6 |   useEffect(() => {
     |   ^^^^^^^^^^^^^^^^^
>  7 |     console.log(props.value);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, [data]);
     | ^^^^^^^^^^^^^ [ReactForget] InvalidReact: This effect may trigger an infinite loop: one or more of its dependencies could not be memoized due to a later mutation (6:8)
   9 |   mutate(data);
  10 |   return data;
  11 | }
```
          
      