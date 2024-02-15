
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
    |             ^^^^^^^^ [ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)
  3 |   const state = x(null);
  4 |   return state[0];
  5 | }
```
          
      