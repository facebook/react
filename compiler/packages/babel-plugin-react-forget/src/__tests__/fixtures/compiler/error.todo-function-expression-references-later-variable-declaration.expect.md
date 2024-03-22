
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
    |     ^^^^^^^ [ReactForget] Invariant: [hoisting] Expected value kind to be initialized. read onClick$0_@1 (3:3)
  4 |   };
  5 |   let onClick;
  6 |
```
          
      