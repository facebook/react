
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}

```


## Error

```
[ReactForget] InvalidInput: Ref values may not be passed to functions because they could read the ref value (`current` property) during render. Cannot access ref object at <unknown> $22:TObject<BuiltInUseRefId> (3:3)
```
          
      