
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
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-aliased-ref-in-callback-invoked-during-render-.ts:9:33
   7 |     return <Foo item={item} current={current} />;
   8 |   };
>  9 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
     |                                  ^^^^^^^^^^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  10 | }
  11 |
```
          
      