
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
  1 | function Component() {
  2 |   let callback = () => {
> 3 |     onClick = () => {};
    |     ^^^^^^^^^^^^^^^^^^ [ReactForget] Todo: Handle non-const declarations for hoisting. variable "onClick" declared with let (3:3)
  4 |   };
  5 |   let onClick;
  6 |
```
          
      