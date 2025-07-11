
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
Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.invalid-destructure-to-local-global-variables.ts:3:6
  1 | function Component(props) {
  2 |   let a;
> 3 |   [a, b] = props.value;
    |       ^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  4 |
  5 |   return [a, b];
  6 | }


```
          
      