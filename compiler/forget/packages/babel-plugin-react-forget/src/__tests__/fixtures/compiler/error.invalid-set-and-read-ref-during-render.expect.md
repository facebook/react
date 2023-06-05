
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  ref.current = props.value;
  return ref.current;
}

```


## Error

```
[ReactForget] InvalidInput: Ref values may not be passed to functions because they could read the ref value (`current` property) during render. Cannot access ref object at store $22[7:9]:TObject<BuiltInUseRefId> (3:3)

[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at freeze $25:TObject<BuiltInRefValue> (4:4)
```
          
      