
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
Error: Cannot reassign variables declared outside of the component/hook

Reassigning a variable declared outside of the component/hook is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global-indirect.ts:4:4
  2 |   const foo = () => {
  3 |     // Cannot assign to globals
> 4 |     someUnknownGlobal = true;
    |     ^^^^^^^^^^^^^^^^^ Cannot reassign variable
  5 |     moduleLocal = true;
  6 |   };
  7 |   foo();
Error: Cannot reassign variables declared outside of the component/hook

Reassigning a variable declared outside of the component/hook is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.reassignment-to-global-indirect.ts:5:4
  3 |     // Cannot assign to globals
  4 |     someUnknownGlobal = true;
> 5 |     moduleLocal = true;
    |     ^^^^^^^^^^^ Cannot reassign variable
  6 |   };
  7 |   foo();
  8 | }
```
          
      