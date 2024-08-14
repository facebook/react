
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
  1 | function Component() {
  2 |   let callback = () => {
> 3 |     callback = null;
    |     ^^^^^^^^ InvalidReact: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `callback` cannot be reassigned after render (3:3)
  4 |   };
  5 |   return <div onClick={callback} />;
  6 | }
```
          
      