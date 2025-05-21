
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
  3 |   if (props.cond) {
  4 |   } else {
> 5 |     x = useHook();
    |         ^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (5:5)
  6 |   }
  7 |   return x;
  8 | }
```
          
      