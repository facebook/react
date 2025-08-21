
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
Found 1 error:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

todo.error.invalid-rules-of-hooks-a0058f0b446d.ts:8:4
   6 | function ComponentWithConditionalHook() {
   7 |   if (cond) {
>  8 |     Namespace.useConditionalHook();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot call hook conditionally
   9 |   }
  10 | }
  11 |
```
          
      