
## Input

```javascript
function Component(props) {
  let y;
  props.cond ? (y = useFoo) : null;
  return y();
}

```


## Error

```
  1 | function Component(props) {
  2 |   let y;
> 3 |   props.cond ? (y = useFoo) : null;
    |                     ^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (3:3)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (3:3)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (4:4)
  4 |   return y();
  5 | }
  6 |
```
          
      