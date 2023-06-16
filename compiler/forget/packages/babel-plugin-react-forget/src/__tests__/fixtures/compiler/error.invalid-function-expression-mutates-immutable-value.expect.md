
## Input

```javascript
function Component(props) {
  const [x, setX] = useState({ value: "" });
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
[ReactForget] InvalidInput: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $40 (frozen) (5:5)
```
          
      