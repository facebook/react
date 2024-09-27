
## Input

```javascript
let renderCount = 0;
function useFoo() {
  renderCount += 1;
  return renderCount;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```


## Error

```
  1 | let renderCount = 0;
  2 | function useFoo() {
> 3 |   renderCount += 1;
    |   ^^^^^^^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (3:3)
  4 |   return renderCount;
  5 | }
  6 |
```
          
      