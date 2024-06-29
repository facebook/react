
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
   6 | const FancyButton = React.forwardRef((props, ref) => {
   7 |   if (props.fancy) {
>  8 |     useCustomHook();
     |     ^^^^^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
   9 |   }
  10 |   return <button ref={ref}>{props.children}</button>;
  11 | });
```
          
      