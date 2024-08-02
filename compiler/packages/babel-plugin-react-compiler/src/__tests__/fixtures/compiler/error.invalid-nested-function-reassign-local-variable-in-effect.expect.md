
## Input

```javascript
import {useEffect} from 'react';
function Component() {
  let local;
  const mk_reassignlocal = () => {
    // Create the reassignment function inside another function, then return it
    const reassignLocal = newValue => {
      local = newValue;
    };
    return reassignLocal;
  };
  const reassignLocal = mk_reassignlocal();
  const onMount = newValue => {
    reassignLocal('hello');
    if (local === newValue) {
      // Without React Compiler, `reassignLocal` is freshly created
      // on each render, capturing a binding to the latest `local`,
      // such that invoking reassignLocal will reassign the same
      // binding that we are observing in the if condition, and
      // we reach this branch
      console.log('`local` was updated!');
    } else {
      // With React Compiler enabled, `reassignLocal` is only created
      // once, capturing a binding to `local` in that render pass.
      // Therefore, calling `reassignLocal` will reassign the wrong
      // version of `local`, and not update the binding we are checking
      // in the if condition.
      //
      // To protect against this, we disallow reassigning locals from
      // functions that escape
      throw new Error('`local` not updated!');
    }
  };
  useEffect(() => {
    onMount();
  }, [onMount]);
  return 'ok';
}

```


## Error

```
   5 |     // Create the reassignment function inside another function, then return it
   6 |     const reassignLocal = newValue => {
>  7 |       local = newValue;
     |       ^^^^^ InvalidReact: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `local` cannot be reassigned after render (7:7)
   8 |     };
   9 |     return reassignLocal;
  10 |   };
```
          
      