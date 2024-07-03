
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook() {
  if (a) return;
  useState();
}

```


## Error

```
  5 | function useHook() {
  6 |   if (a) return;
> 7 |   useState();
    |   ^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)
  8 | }
  9 |
```
          
      