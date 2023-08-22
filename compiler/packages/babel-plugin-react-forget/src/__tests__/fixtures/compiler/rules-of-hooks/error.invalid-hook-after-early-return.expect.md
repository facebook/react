
## Input

```javascript
function Component(props) {
  if (props.cond) {
    return null;
  }
  return useHook();
}

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (5:5)
```
          
      