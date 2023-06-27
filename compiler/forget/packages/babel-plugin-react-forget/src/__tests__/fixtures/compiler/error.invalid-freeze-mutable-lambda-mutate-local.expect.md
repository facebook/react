
## Input

```javascript
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
[ReactForget] InvalidReact: Cannot use a mutable function where an immutable value is expected (8:8)
```
          
      