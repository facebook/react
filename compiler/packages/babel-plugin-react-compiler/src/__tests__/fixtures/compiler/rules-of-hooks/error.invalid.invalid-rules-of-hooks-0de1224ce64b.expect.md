
## Input

```javascript
// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
function createComponent() {
  return function ComponentWithHookInsideCallback() {
    useEffect(() => {
      useHookInsideCallback();
    });
  };
}

```


## Error

```
  4 |   return function ComponentWithHookInsideCallback() {
  5 |     useEffect(() => {
> 6 |       useHookInsideCallback();
    |       ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call Custom within a function component (6:6)

InvalidReact: Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning). Cannot call useEffect within a function component (5:5)
  7 |     });
  8 |   };
  9 | }
```
          
      