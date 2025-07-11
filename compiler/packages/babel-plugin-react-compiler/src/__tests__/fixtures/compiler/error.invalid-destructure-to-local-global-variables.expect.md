
## Input

```javascript
function Component(props) {
  let a;
  [a, b] = props.value;

  return [a, b];
}

```


## Error

```
Found 1 error:
Error: Cannot reassign variables declared outside of the component/hook

Reassigning a variable declared outside of the component/hook is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.invalid-destructure-to-local-global-variables.ts:3:6
  1 | function Component(props) {
  2 |   let a;
> 3 |   [a, b] = props.value;
    |       ^ Cannot reassign variable
  4 |
  5 |   return [a, b];
  6 | }
```
          
      