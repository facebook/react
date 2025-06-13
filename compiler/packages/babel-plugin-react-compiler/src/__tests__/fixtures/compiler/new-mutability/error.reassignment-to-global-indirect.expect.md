
## Input

```javascript
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
  2 |   const foo = () => {
  3 |     // Cannot assign to globals
> 4 |     someUnknownGlobal = true;
    |     ^^^^^^^^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (4:4)
  5 |     moduleLocal = true;
  6 |   };
  7 |   foo();
```
          
      