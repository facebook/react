
## Input

```javascript
// @inlineUseMemo
function component(a, b) {
  let x = useMemo((c) => a, []);
  return x;
}

```


## Error

```
[ReactForget] Invariant: Did not expect any arguments to useMemo callback (3:3)
```
          
      