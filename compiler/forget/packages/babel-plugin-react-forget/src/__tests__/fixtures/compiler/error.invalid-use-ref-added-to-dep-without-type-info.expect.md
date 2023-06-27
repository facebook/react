
## Input

```javascript
function Foo({ a }) {
  const ref = useRef();
  // type information is lost here as we don't track types of fields
  const val = { ref };
  // without type info, we don't know that val.ref.current is a ref value so we
  // *would* end up depending on val.ref.current
  // however, this is an instance of accessing a ref during render and is disallowed
  // under React's rules, so we reject this input
  const x = { a, val: val.ref.current };

  return <VideoList videos={x} />;
}

```


## Error

```
[ReactForget] InvalidReact: Ref values may not be passed to functions because they could read the ref value (`current` property) during render. Cannot access ref object at capture $29:TObject<BuiltInUseRefId> (4:4)
```
          
      