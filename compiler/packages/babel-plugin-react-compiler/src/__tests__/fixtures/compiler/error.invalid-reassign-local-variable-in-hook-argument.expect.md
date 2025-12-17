
## Input

```javascript
import {useEffect} from 'react';
import {useIdentity} from 'shared-runtime';

function Component() {
  let local;

  const reassignLocal = newValue => {
    local = newValue;
  };

  const callback = newValue => {
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

  useIdentity(() => {
    callback();
  });

  return 'ok';
}

```


## Error

```
Found 1 error:

Error: Cannot reassign variable after render completes

Reassigning `local` after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead.

error.invalid-reassign-local-variable-in-hook-argument.ts:8:4
   6 |
   7 |   const reassignLocal = newValue => {
>  8 |     local = newValue;
     |     ^^^^^ Cannot reassign `local` after render completes
   9 |   };
  10 |
  11 |   const callback = newValue => {
```
          
      