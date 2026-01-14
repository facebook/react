
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

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-aliased-ref-in-callback-invoked-during-render-.ts:7:37
   5 |     const aliasedRef = ref;
   6 |     const current = aliasedRef.current;
>  7 |     return <Foo item={item} current={current} />;
     |                                      ^^^^^^^ Ref value is used during render
   8 |   };
   9 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
  10 | }

error.invalid-aliased-ref-in-callback-invoked-during-render-.ts:6:20
  4 |   const renderItem = item => {
  5 |     const aliasedRef = ref;
> 6 |     const current = aliasedRef.current;
    |                     ^^^^^^^^^^^^^^^^^^ Ref is initially accessed
  7 |     return <Foo item={item} current={current} />;
  8 |   };
  9 |   return <Items>{props.items.map(item => renderItem(item))}</Items>;
```
          
      