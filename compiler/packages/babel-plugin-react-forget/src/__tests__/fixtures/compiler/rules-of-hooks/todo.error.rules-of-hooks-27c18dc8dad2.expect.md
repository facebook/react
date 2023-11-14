
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
const FancyButton = React.forwardRef((props, ref) => {
  if (props.fancy) {
    useCustomHook();
  }
  return <button ref={ref}>{props.children}</button>;
});

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
```
          
      