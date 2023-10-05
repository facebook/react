
## Input

```javascript
// @validateFrozenLambdas
function Component(props) {
  const x = {};
  const onChange = (e) => {
    // INVALID! should use copy-on-write and pass the new value
    x.value = e.target.value;
    setX(x);
  };
  return <input value={x.value} onChange={onChange} />;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a variable that is managed by React, where an immutable value or a function was expected (9:9)
```
          
      