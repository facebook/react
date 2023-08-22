
## Input

```javascript
// Expected to fail

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHookWithConditionalHook() {
  if (cond) {
    useConditionalHook();
  }
}

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (7:7)
```
          
      