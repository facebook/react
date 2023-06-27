
## Input

```javascript
function component(a, b) {
  let x = useMemo((c) => a, []);
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: useMemo callbacks may not accept any arguments (2:2)
```
          
      