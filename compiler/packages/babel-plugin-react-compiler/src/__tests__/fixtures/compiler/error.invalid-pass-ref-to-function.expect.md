
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}

```


## Error

```
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   const x = foo(ref);
    |                 ^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at mutate? $21[6:8]:TObject<BuiltInUseRefId> (4:4)
  5 |   return x.current;
  6 | }
  7 |
```
          
      