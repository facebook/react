
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const renderItem = (item) => {
    const current = ref.current;
    return <Foo item={item} current={current} />;
  };
  return <Items>{props.items.map((item) => renderItem(item))}</Items>;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at mutate? $60[14:16] (8:8)
```
          
      