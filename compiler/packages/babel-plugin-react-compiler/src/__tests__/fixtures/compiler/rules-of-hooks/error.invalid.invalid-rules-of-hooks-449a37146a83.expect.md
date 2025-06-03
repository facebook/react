
## Input

```javascript
// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
function createComponent() {
  return function ComponentWithHookInsideCallback() {
    function handleClick() {
      useState();
    }
  };
}

```


## Error

```
  4 |   return function ComponentWithHookInsideCallback() {
  5 |     function handleClick() {
> 6 |       useState();
    |       ^^^^^^^^ InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call useState within a function expression (6:6)
  7 |     }
  8 |   };
  9 | }
```
          
      