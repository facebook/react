
## Input

```javascript
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
[ReactForget] InvalidInput: Cannot use a mutable function where an immutable value is expected (6:6)
```
          
      