
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  return <Foo ref={ref.current} />;
}

```


## Error

```
[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at freeze $20:TObject<BuiltInRefValue> (3:3)
```
          
      