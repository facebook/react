
## Input

```javascript
// @enableNewMutationAliasingModel
function Component() {
  const foo = () => {
    // Cannot assign to globals
    someUnknownGlobal = true;
    moduleLocal = true;
  };
  foo();
}

```


## Error

```
  3 |   const foo = () => {
  4 |     // Cannot assign to globals
> 5 |     someUnknownGlobal = true;
    |     ^^^^^^^^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (5:5)

InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (6:6)
  6 |     moduleLocal = true;
  7 |   };
  8 |   foo();
```
          
      