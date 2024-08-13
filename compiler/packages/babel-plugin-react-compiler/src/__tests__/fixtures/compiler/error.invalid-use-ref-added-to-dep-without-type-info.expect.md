
## Input

```javascript
// @validateRefAccessDuringRender
function Foo({a}) {
  const ref = useRef();
  // type information is lost here as we don't track types of fields
  const val = {ref};
  // without type info, we don't know that val.ref.current is a ref value so we
  // *would* end up depending on val.ref.current
  // however, this is an instance of accessing a ref during render and is disallowed
  // under React's rules, so we reject this input
  const x = {a, val: val.ref.current};

  return <VideoList videos={x} />;
}

```


## Error

```
  3 |   const ref = useRef();
  4 |   // type information is lost here as we don't track types of fields
> 5 |   const val = {ref};
    |                ^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (5:5)
  6 |   // without type info, we don't know that val.ref.current is a ref value so we
  7 |   // *would* end up depending on val.ref.current
  8 |   // however, this is an instance of accessing a ref during render and is disallowed
```
          
      