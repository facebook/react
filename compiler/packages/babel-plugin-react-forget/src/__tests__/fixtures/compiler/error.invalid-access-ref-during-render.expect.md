
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const value = ref.current;
  return value;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $22:TObject<BuiltInRefValue> (5:5)
```
          
      