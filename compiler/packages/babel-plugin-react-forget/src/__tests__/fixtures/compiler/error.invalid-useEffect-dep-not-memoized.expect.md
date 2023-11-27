
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
[ReactForget] InvalidReact: This effect may trigger an infinite loop: one or more of its dependencies could not be memoized due to a later mutation (6:8)
```
          
      