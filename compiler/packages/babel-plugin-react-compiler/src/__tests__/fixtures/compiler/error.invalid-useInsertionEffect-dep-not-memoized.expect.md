
## Input

```javascript
// @validateMemoizedEffectDependencies
import {useInsertionEffect} from 'react';

function Component(props) {
  const data = {};
  useInsertionEffect(() => {
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
>  6 |   useInsertionEffect(() => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |     console.log(props.value);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, [data]);
     | ^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior (6:8)
   9 |   mutate(data);
  10 |   return data;
  11 | }
```
          
      