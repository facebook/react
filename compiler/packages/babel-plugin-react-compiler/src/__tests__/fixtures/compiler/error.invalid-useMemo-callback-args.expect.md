
## Input

```javascript
function component(a, b) {
  let x = useMemo(c => a, []);
  return x;
}

```


## Error

```
  1 | function component(a, b) {
> 2 |   let x = useMemo(c => a, []);
    |                   ^^^^^^ InvalidReact: useMemo callbacks may not accept any arguments (2:2)
  3 |   return x;
  4 | }
  5 |
```
          
      