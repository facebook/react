
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(1);
  const [state] = useState(() => ref.current);
  return <div>{state}</div>;
}

```


## Error

```
  2 | function Component(props) {
  3 |   const ref = useRef(1);
> 4 |   const [state] = useState(() => ref.current);
    |                            ^^^^^^^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (4:4)
  5 |   return <div>{state}</div>;
  6 | }
  7 |
```
          
      