
## Input

```javascript
function Component() {
  let callback = () => {
    onClick = () => {};
  };
  let onClick;

  return <div onClick={callback} />;
}

```


## Error

```
Found 1 error:
Error: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead

Variable `onClick` cannot be reassigned after render.

error.todo-function-expression-references-later-variable-declaration.ts:3:4
  1 | function Component() {
  2 |   let callback = () => {
> 3 |     onClick = () => {};
    |     ^^^^^^^ Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead
  4 |   };
  5 |   let onClick;
  6 |


```
          
      