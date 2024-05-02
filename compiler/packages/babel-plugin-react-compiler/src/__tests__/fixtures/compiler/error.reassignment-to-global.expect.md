
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
  1 | function Component() {
  2 |   // Cannot assign to globals
> 3 |   someUnknownGlobal = true;
    |   ^^^^^^^^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (3:3)
  4 |   moduleLocal = true;
  5 | }
  6 |
```
          
      