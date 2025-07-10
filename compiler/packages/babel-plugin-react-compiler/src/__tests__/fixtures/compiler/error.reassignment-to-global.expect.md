
## Input

```javascript
function Component() {
  // Cannot assign to globals
  someUnknownGlobal = true;
  moduleLocal = true;
}

```


## Error

```
Found 2 errors:
Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global.ts:3:2
  1 | function Component() {
  2 |   // Cannot assign to globals
> 3 |   someUnknownGlobal = true;
    |   ^^^^^^^^^^^^^^^^^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  4 |   moduleLocal = true;
  5 | }
  6 |


Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global.ts:4:2
  2 |   // Cannot assign to globals
  3 |   someUnknownGlobal = true;
> 4 |   moduleLocal = true;
    |   ^^^^^^^^^^^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  5 | }
  6 |


```
          
      