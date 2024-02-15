
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
  3 |   const ref = useRef(null);
  4 |   ref.current = props.value;
> 5 |   return ref.current;
    |          ^^^^^^^^^^^ [ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $24:TObject<BuiltInRefValue> (5:5)
  6 | }
  7 |
```
          
      