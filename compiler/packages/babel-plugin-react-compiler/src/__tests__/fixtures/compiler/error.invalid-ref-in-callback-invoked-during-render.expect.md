
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const renderItem = item => {
    const current = ref.current;
    return <Foo item={item} current={current} />;
  };
  return <Items>{props.items.map(item => renderItem(item))}</Items>;
}

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-ref-in-callback-invoked-during-render.ts:8:33
   6 |     return <Foo item={item} current={current} />;
   7 |   };
>  8 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
     |                                  ^^^^^^^^^^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   9 | }
  10 |
```
          
      