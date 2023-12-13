
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
[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (4:4)
```
          
      