
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return {x};
}

```


## Error

```
Found 1 error:
Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.invalid-destructure-assignment-to-global.ts:2:3
  1 | function useFoo(props) {
> 2 |   [x] = props;
    |    ^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  3 |   return {x};
  4 | }
  5 |


```
          
      