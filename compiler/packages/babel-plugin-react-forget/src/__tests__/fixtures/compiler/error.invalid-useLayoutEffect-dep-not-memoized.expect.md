
## Input

```javascript
// @validateMemoizedEffectDependencies
import { useLayoutEffect } from "react";

function Component(props) {
  const data = {};
  useLayoutEffect(() => {
    console.log(props.value);
  }, [data]);
  mutate(data);
  return data;
}

```


## Error

```
[ReactForget] InvalidReact: This effect may trigger an infinite loop: one or more of its dependencies could not be memoized due to a later mutation (6:8)
```
          
      