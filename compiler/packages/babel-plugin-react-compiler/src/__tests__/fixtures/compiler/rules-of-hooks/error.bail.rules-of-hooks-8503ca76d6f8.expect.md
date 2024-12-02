
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
const ComponentWithHookInsideCallback = React.memo(props => {
  useEffect(() => {
    useHookInsideCallback();
  });
  return <button {...props} />;
});

```


## Error

```
   6 | const ComponentWithHookInsideCallback = React.memo(props => {
   7 |   useEffect(() => {
>  8 |     useHookInsideCallback();
     |     ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (8:8)
   9 |   });
  10 |   return <button {...props} />;
  11 | });
```
          
      