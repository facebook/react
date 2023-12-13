
## Input

```javascript
function Component(props) {
  // This is a violation of using a hook as a normal value rule:
  const getUser = props.cond ? useGetUser : emptyFunction;

  // Ideally we would report a "conditional hook call" error here.
  // It's an unconditional call, but the value may or may not be a hook.
  // TODO: report a conditional hook call error here
  return getUser();
}

```


## Error

```
[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)

[ReactForget] InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (8:8)
```
          
      