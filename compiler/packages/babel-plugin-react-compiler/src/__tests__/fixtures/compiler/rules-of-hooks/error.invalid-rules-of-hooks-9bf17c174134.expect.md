
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook() {
  a && useHook1();
  b && useHook2();
}

```


## Error

```
  4 | // This *must* be invalid.
  5 | function useHook() {
> 6 |   a && useHook1();
    |        ^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (6:6)

InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)
  7 |   b && useHook2();
  8 | }
  9 |
```
          
      