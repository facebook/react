
## Input

```javascript
function Component(props) {
  const x = props.cond ? useA : useB;
  return x();
}

```


## Error

```
  1 | function Component(props) {
> 2 |   const x = props.cond ? useA : useB;
    |                          ^^^^ [ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)
  3 |   return x();
  4 | }
  5 |
```
          
      