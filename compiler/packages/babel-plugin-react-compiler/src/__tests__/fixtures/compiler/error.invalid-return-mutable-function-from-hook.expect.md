
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
Found 2 errors:
Error: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead

error.invalid-return-mutable-function-from-hook.ts:7:9
   5 |   useHook(); // for inference to kick in
   6 |   const cache = new Map();
>  7 |   return () => {
     |          ^^^^^^^
>  8 |     cache.set('key', 'value');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   };
     | ^^^^ This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead
  10 | }
  11 |


Error: The function modifies a local variable here

error.invalid-return-mutable-function-from-hook.ts:8:4
   6 |   const cache = new Map();
   7 |   return () => {
>  8 |     cache.set('key', 'value');
     |     ^^^^^ The function modifies a local variable here
   9 |   };
  10 | }
  11 |


```
          
      