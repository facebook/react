
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

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-ref-in-callback-invoked-during-render.ts:6:37
  4 |   const renderItem = item => {
  5 |     const current = ref.current;
> 6 |     return <Foo item={item} current={current} />;
    |                                      ^^^^^^^ Ref value is used during render
  7 |   };
  8 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
  9 | }

error.invalid-ref-in-callback-invoked-during-render.ts:5:20
  3 |   const ref = useRef(null);
  4 |   const renderItem = item => {
> 5 |     const current = ref.current;
    |                     ^^^^^^^^^^^ Ref is initially accessed
  6 |     return <Foo item={item} current={current} />;
  7 |   };
  8 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
```
          
      