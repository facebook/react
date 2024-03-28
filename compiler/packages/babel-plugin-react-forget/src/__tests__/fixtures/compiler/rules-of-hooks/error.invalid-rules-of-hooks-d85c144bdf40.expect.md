
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHookInLoops() {
  while (a) {
    useHook1();
    if (b) continue;
    useHook2();
  }
}

```


## Error

```
   5 | function useHookInLoops() {
   6 |   while (a) {
>  7 |     useHook1();
     |     ^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)

InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (9:9)
   8 |     if (b) continue;
   9 |     useHook2();
  10 |   }
```
          
      