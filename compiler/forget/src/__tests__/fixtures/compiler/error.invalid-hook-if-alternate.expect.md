
## Input

```javascript
function Component(props) {
  let x = null;
  if (props.cond) {
  } else {
    x = useHook();
  }
  return x;
}

```


## Error

```
[ReactForget] InvalidInput: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (5:5)
```
          
      