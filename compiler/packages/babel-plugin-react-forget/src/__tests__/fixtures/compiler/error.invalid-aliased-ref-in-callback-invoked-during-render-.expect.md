
## Input

```javascript
// @validateRefAccessDuringRender @validateRefAccessDuringRenderFunctionExpressions
function Component(props) {
  const ref = useRef(null);
  const renderItem = (item) => {
    const aliasedRef = ref;
    const current = aliasedRef.current;
    return <Foo item={item} current={current} />;
  };
  return <Items>{props.items.map((item) => renderItem(item))}</Items>;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at mutate? $64[13:15] (9:9)
```
          
      