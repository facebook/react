
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
Found 2 errors:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-use-ref-added-to-dep-without-type-info.ts:10:21
   8 |   // however, this is an instance of accessing a ref during render and is disallowed
   9 |   // under React's rules, so we reject this input
> 10 |   const x = {a, val: val.ref.current};
     |                      ^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  11 |
  12 |   return <VideoList videos={x} />;
  13 | }

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-use-ref-added-to-dep-without-type-info.ts:10:21
   8 |   // however, this is an instance of accessing a ref during render and is disallowed
   9 |   // under React's rules, so we reject this input
> 10 |   const x = {a, val: val.ref.current};
     |                      ^^^^^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  11 |
  12 |   return <VideoList videos={x} />;
  13 | }
```
          
      