
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
    |     ^^^^^^^^^^^^^^^ Todo: Handle non-const declarations for hoisting. variable "callback" declared with let (3:3)
  4 |   };
  5 |   return <div onClick={callback} />;
  6 | }
```
          
      