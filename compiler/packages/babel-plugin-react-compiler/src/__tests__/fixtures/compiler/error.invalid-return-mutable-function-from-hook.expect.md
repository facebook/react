
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions
import {useHook} from 'shared-runtime';

function useFoo() {
  useHook(); // for inference to kick in
  const cache = new Map();
  return () => {
    cache.set('key', 'value');
  };
}

```


## Error

```
   5 |   useHook(); // for inference to kick in
   6 |   const cache = new Map();
>  7 |   return () => {
     |          ^^^^^^^
>  8 |     cache.set('key', 'value');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   };
     | ^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (7:9)

InvalidReact: The function modifies a local variable here (8:8)
  10 | }
  11 |
```
          
      