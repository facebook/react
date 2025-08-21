
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
Found 1 error:

Error: Cannot call hooks within function expressions

Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

error.invalid.invalid-rules-of-hooks-d842d36db450.ts:6:6
  4 |   return function ComponentWithConditionalHook() {
  5 |     if (cond) {
> 6 |       useConditionalHook();
    |       ^^^^^^^^^^^^^^^^^^ Cannot call hook within a function expression
  7 |     }
  8 |   };
  9 | }
```
          
      