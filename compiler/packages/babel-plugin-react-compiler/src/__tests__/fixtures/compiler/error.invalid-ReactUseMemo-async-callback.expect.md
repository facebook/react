
## Input

```javascript
function component(a, b) {
  let x = React.useMemo(async () => {
    await a;
  }, []);
  return x;
}

```


## Error

```
  1 | function component(a, b) {
> 2 |   let x = React.useMemo(async () => {
    |                         ^^^^^^^^^^^^^
> 3 |     await a;
    | ^^^^^^^^^^^^
> 4 |   }, []);
    | ^^^^ InvalidReact: useMemo callbacks may not be async or generator functions (2:4)
  5 |   return x;
  6 | }
  7 |
```
          
      