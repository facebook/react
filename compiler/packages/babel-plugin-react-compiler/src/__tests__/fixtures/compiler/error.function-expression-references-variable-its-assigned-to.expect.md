
## Input

```javascript
function Component() {
  let callback = () => {
    callback = null;
  };
  return <div onClick={callback} />;
}

```


## Error

```
Found 1 error:
Error: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead

Variable `callback` cannot be reassigned after render.

error.function-expression-references-variable-its-assigned-to.ts:3:4
  1 | function Component() {
  2 |   let callback = () => {
> 3 |     callback = null;
    |     ^^^^^^^^ Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead
  4 |   };
  5 |   return <div onClick={callback} />;
  6 | }


```
          
      