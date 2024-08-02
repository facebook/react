
## Input

```javascript
let b = 1;

export default function useMyHook() {
  const fn = () => {
    b = 2;
  };
  const obj = { fn };
  obj.fn();
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMyHook,
  params: [],
};

```


## Error

```
  3 | export default function useMyHook() {
  4 |   const fn = () => {
> 5 |     b = 2;
    |     ^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (5:5)
  6 |   };
  7 |   const obj = { fn };
  8 |   obj.fn();
```
          
      