
## Input

```javascript
function Component() {
  let local;

  const reassignLocal = newValue => {
    local = newValue;
  };

  const onClick = newValue => {
    reassignLocal('hello');

    if (local === newValue) {
      // Without React Compiler, `reassignLocal` is freshly created
      // on each render, capturing a binding to the latest `local`,
      // such that invoking reassignLocal will reassign the same
      // binding that we are observing in the if condition, and
      // we reach this branch
      console.log('`local` was updated!');
    } else {
      // With React Compiler enabled, `reassignLocal` is only created
      // once, capturing a binding to `local` in that render pass.
      // Therefore, calling `reassignLocal` will reassign the wrong
      // version of `local`, and not update the binding we are checking
      // in the if condition.
      //
      // To protect against this, we disallow reassigning locals from
      // functions that escape
      throw new Error('`local` not updated!');
    }
  };

  return <button onClick={onClick}>Submit</button>;
}

```


## Error

```
  29 |   };
  30 |
> 31 |   return <button onClick={onClick}>Submit</button>;
     |                           ^^^^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (31:31)

InvalidReact: The function modifies a local variable here (5:5)
  32 | }
  33 |
```
          
      