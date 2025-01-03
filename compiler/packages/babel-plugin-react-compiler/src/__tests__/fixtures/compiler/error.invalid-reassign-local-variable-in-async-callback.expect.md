
## Input

```javascript
function Component() {
  let value = null;
  const reassign = async () => {
    await foo().then(result => {
      // Reassigning a local variable in an async function is *always* mutating
      // after render, so this should error regardless of where this ends up
      // getting called
      value = result;
    });
  };

  const onClick = async () => {
    await reassign();
  };
  return <div onClick={onClick}>Click</div>;
}

```


## Error

```
   6 |       // after render, so this should error regardless of where this ends up
   7 |       // getting called
>  8 |       value = result;
     |       ^^^^^ InvalidReact: Reassigning a variable in an async function can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `value` cannot be reassigned after render (8:8)
   9 |     });
  10 |   };
  11 |
```
          
      