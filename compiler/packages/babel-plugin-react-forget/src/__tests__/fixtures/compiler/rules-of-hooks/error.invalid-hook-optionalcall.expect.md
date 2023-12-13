
## Input

```javascript
function Component() {
  const { result } = useConditionalHook?.() ?? {};
  return result;
}

```


## Error

```
[ReactForget] InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)
```
          
      