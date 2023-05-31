
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
[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at <unknown> $25:TObject<BuiltInRefValue> (4:4)
```
          
      