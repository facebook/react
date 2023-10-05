
## Input

```javascript
// @validateFrozenLambdas
function Component(props) {
  let x = "";
  const onChange = (e) => {
    x = e.target.value;
  };
  return <input value={x} onChange={onChange} />;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a variable that is managed by React, where an immutable value or a function was expected (7:7)
```
          
      