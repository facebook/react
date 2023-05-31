
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
[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at <unknown> $20:TObject<BuiltInRefValue> (4:4)

[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at <unknown> value$21:TObject<BuiltInRefValue> (5:5)

[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at <unknown> $23:TObject<BuiltInRefValue> (5:5)
```
          
      