
## Input

```javascript
// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function createComponent() {
  return function ComponentWithConditionalHook() {
    if (cond) {
      useConditionalHook();
    }
  };
}

```


## Error

```
  4 |   return function ComponentWithConditionalHook() {
  5 |     if (cond) {
> 6 |       useConditionalHook();
    |       ^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (6:6)
  7 |     }
  8 |   };
  9 | }
```
          
      