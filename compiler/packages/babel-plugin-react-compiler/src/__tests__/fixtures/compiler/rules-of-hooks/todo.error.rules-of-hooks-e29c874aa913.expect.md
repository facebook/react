
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook() {
  try {
    f();
    useState();
  } catch {}
}

```


## Error

```
   7 |   try {
   8 |     f();
>  9 |     useState();
     |     ^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (9:9)
  10 |   } catch {}
  11 | }
  12 |
```
          
      