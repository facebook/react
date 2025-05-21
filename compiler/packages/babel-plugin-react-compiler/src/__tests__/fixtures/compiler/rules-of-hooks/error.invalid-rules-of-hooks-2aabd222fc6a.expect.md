
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function ComponentWithConditionalHook() {
  if (cond) {
    useConditionalHook();
  }
}

```


## Error

```
   5 | function ComponentWithConditionalHook() {
   6 |   if (cond) {
>  7 |     useConditionalHook();
     |     ^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)
   8 |   }
   9 | }
  10 |
```
          
      