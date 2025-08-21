
## Input

```javascript
// @skip
// Unsupported input

// This is valid because "use"-prefixed functions called in
// unnamed function arguments are not assumed to be hooks.
React.unknownFunction((foo, bar) => {
  if (foo) {
    useNotAHook(bar);
  }
});

```


## Error

```
Found 1 error:

Error: Cannot call hooks conditionally

Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)

todo.error.rules-of-hooks-d0935abedc42.ts:8:4
   6 | React.unknownFunction((foo, bar) => {
   7 |   if (foo) {
>  8 |     useNotAHook(bar);
     |     ^^^^^^^^^^^ Cannot call hook conditionally
   9 |   }
  10 | });
  11 |
```
          
      