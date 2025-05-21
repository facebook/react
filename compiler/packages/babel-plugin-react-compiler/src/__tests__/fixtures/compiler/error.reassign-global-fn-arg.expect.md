
## Input

```javascript
let b = 1;

export default function MyApp() {
  const fn = () => {
    b = 2;
  };
  return foo(fn);
}

function foo(fn) {}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [],
};

```


## Error

```
  3 | export default function MyApp() {
  4 |   const fn = () => {
> 5 |     b = 2;
    |     ^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (5:5)
  6 |   };
  7 |   return foo(fn);
  8 | }
```
          
      