
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
  3 |   const ref = useRef(null);
  4 |   const value = ref.current;
> 5 |   return value;
    |          ^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $22:TObject<BuiltInRefValue> (5:5)
  6 | }
  7 |
```
          
      