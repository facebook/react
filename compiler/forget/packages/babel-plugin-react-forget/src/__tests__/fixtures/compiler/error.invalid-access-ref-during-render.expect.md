
## Input

```javascript
// @debug
function Component(props) {
  const ref = useRef(null);
  const value = ref.current;
  return value;
}

```


## Error

```
[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at freeze $22:TObject<BuiltInRefValue> (5:5)
```
          
      