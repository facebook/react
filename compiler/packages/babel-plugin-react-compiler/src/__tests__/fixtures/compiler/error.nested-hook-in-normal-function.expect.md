
## Input

```javascript
// @validateNoDynamicallyCreatedComponentsOrHooks
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

Error: Components and hooks cannot be created dynamically

The function `useConfiguredState` appears to be a React hook, but it's defined inside `createCustomHook`. Components and Hooks should always be declared at module scope.

error.nested-hook-in-normal-function.ts:4:9
  2 | import {useState} from 'react';
  3 |
> 4 | function createCustomHook(config) {
    |          ^^^^^^^^^^^^^^^^ this function dynamically created a component/hook
  5 |   function useConfiguredState() {
  6 |     const [state, setState] = useState(0);
  7 |

error.nested-hook-in-normal-function.ts:5:11
  3 |
  4 | function createCustomHook(config) {
> 5 |   function useConfiguredState() {
    |            ^^^^^^^^^^^^^^^^^^ the component is created here
  6 |     const [state, setState] = useState(0);
  7 |
  8 |     const increment = () => {
```
          
      