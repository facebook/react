
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  ref.current = props.value;
  return ref.current;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values may not be passed to functions because they could read the ref value (`current` property) during render. (https://react.dev/reference/react/useRef). Cannot access ref object at store $21[7:9]:TObject<BuiltInUseRefId> (4:4)

[ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $24:TObject<BuiltInRefValue> (5:5)
```
          
      