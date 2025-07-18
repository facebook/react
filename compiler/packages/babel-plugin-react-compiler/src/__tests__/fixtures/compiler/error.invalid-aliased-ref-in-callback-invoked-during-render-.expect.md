
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const renderItem = item => {
    const aliasedRef = ref;
    const current = aliasedRef.current;
    return <Foo item={item} current={current} />;
  };
  return <Items>{props.items.map(item => renderItem(item))}</Items>;
}

```


## Error

```
  4 |   const renderItem = item => {
  5 |     const aliasedRef = ref;
> 6 |     const current = aliasedRef.current;
    |                     ^^^^^^^^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (6:6)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value `current` (7:7)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (7:7)
  7 |     return <Foo item={item} current={current} />;
  8 |   };
  9 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
```
          
      