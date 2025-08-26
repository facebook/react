
## Input

```javascript
// @validateNoComponentOrHookFactories
import {useState} from 'react';

function createCustomHook(config) {
  function useConfiguredState() {
    const [state, setState] = useState(0);

    const increment = () => {
      setState(state + config.step);
    };

    return [state, increment];
  }

  return useConfiguredState;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createCustomHook,
  isComponent: false,
  params: [{step: 1}],
};

```


## Error

```
Found 1 error:

Error: Cannot compile nested hook inside a non-React function

The function "useConfiguredState" appears to be a React hook, but it's defined inside "createCustomHook", which is not a React component or hook. The compiler cannot optimize nested React functions when the parent function is not compiled, as this leads to scope reference errors. Either move "useConfiguredState" to the module level, or ensure the parent function follows React naming conventions (PascalCase for components, "use" prefix for hooks).

error.nested-hook-in-normal-function.ts:5:2
   3 |
   4 | function createCustomHook(config) {
>  5 |   function useConfiguredState() {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  6 |     const [state, setState] = useState(0);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |     const increment = () => {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |       setState(state + config.step);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 10 |     };
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 11 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 12 |     return [state, increment];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 13 |   }
     | ^^^^ Cannot compile nested hook inside a non-React function
  14 |
  15 |   return useConfiguredState;
  16 | }
```
          
      