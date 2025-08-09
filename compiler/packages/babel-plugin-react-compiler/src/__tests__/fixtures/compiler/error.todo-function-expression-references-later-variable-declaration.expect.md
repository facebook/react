
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

Error: Cannot reassign local variables after render completes

Reassigning local variables after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead.

error.todo-function-expression-references-later-variable-declaration.ts:3:4
  1 | function Component() {
  2 |   let callback = () => {
> 3 |     onClick = () => {};
    |     ^^^^^^^ Cannot reassign `onClick` after render completes
  4 |   };
  5 |   let onClick;
  6 |
```
          
      