
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values may not be passed to functions because they could read the ref value (`current` property) during render. (https://react.dev/reference/react/useRef). Cannot access ref object at mutate? $21[6:8]:TObject<BuiltInUseRefId> (4:4)
```
          
      