
## Input

```javascript
function Component(props) {
  const x = useState;
  const state = x(null);
  return state[0];
}

```


## Error

```
  1 | function Component(props) {
> 2 |   const x = useState;
    |             ^^^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (2:2)
  3 |   const state = x(null);
  4 |   return state[0];
  5 | }
```
          
      