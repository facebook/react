
## Input

```javascript
// @debug
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
[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at capture $42[6:16]:TObject<BuiltInRefValue> (5:5)
```
          
      