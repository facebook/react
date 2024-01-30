
## Input

```javascript
// @skip
// Passed but should have failed

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
const MemoizedButton = memo(function (props) {
  if (props.fancy) {
    useCustomHook();
  }
  return <button>{props.children}</button>;
});

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
```
          
      