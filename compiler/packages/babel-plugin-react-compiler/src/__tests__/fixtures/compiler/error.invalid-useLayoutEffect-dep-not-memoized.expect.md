
## Input

```javascript
// @validateMemoizedEffectDependencies
import {useLayoutEffect} from 'react';

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
Found 1 error:

Memoization: React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior

error.invalid-useLayoutEffect-dep-not-memoized.ts:6:2
   4 | function Component(props) {
   5 |   const data = {};
>  6 |   useLayoutEffect(() => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^
>  7 |     console.log(props.value);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, [data]);
     | ^^^^^^^^^^^^^ React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior
   9 |   mutate(data);
  10 |   return data;
  11 | }
```
          
      