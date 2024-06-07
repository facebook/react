
## Input

```javascript
// @validateRefAccessDuringRender
function Component() {
  const ref = useRef(null);
  ref.current = false;

  return <button ref={ref} />;
}

```


## Error

```
  2 | function Component() {
  3 |   const ref = useRef(null);
> 4 |   ref.current = false;
    |   ^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (4:4)
  5 |
  6 |   return <button ref={ref} />;
  7 | }
```
          
      