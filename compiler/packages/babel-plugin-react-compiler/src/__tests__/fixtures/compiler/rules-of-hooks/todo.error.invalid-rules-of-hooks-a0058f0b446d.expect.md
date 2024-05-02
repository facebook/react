
## Input

```javascript
// @skip
// Passed but should have failed

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function ComponentWithConditionalHook() {
  if (cond) {
    Namespace.useConditionalHook();
  }
}

```


## Error

```
   6 | function ComponentWithConditionalHook() {
   7 |   if (cond) {
>  8 |     Namespace.useConditionalHook();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
   9 |   }
  10 | }
  11 |
```
          
      