
## Input

```javascript
function Component(props) {
  const x = props.cond ? (useFoo ? 1 : 2) : 3;
  return x;
}

```


## Error

```
  1 | function Component(props) {
> 2 |   const x = props.cond ? (useFoo ? 1 : 2) : 3;
    |                           ^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (2:2)
  3 |   return x;
  4 | }
  5 |
```
          
      