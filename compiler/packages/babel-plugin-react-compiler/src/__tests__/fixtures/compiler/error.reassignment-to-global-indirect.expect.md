
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
Found 2 errors:
Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global-indirect.ts:4:4
  2 |   const foo = () => {
  3 |     // Cannot assign to globals
> 4 |     someUnknownGlobal = true;
    |     ^^^^^^^^^^^^^^^^^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  5 |     moduleLocal = true;
  6 |   };
  7 |   foo();


Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global-indirect.ts:5:4
  3 |     // Cannot assign to globals
  4 |     someUnknownGlobal = true;
> 5 |     moduleLocal = true;
    |     ^^^^^^^^^^^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  6 |   };
  7 |   foo();
  8 | }


```
          
      