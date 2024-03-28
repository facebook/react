
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
    |                     ^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (4:4)
  4 |   return y();
  5 | }
  6 |
```
          
      