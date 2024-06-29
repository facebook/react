
## Input

```javascript
function Component(props) {
  return <Child foo={useFoo} />;
}

```


## Error

```
  1 | function Component(props) {
> 2 |   return <Child foo={useFoo} />;
    |                      ^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (2:2)
  3 | }
  4 |
```
          
      