
## Input

```javascript
// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function useHook() {
  if (a) return;
  if (b) {
    console.log("true");
  } else {
    console.log("false");
  }
  useState();
}

```


## Error

```
[ReactForget] InvalidInput: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (10:10)
```
          
      