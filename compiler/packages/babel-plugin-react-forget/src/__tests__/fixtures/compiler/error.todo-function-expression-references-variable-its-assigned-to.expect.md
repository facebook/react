
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
    |     ^^^^^^^^ [ReactForget] Invariant: [hoisting] Expected value kind to be initialized. read callback$0_@0 (3:3)
  4 |   };
  5 |   return <div onClick={callback} />;
  6 | }
```
          
      