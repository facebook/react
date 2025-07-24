
## Input

```javascript
// @enableValidateNoVoidUseMemo
function Component() {
  const value = useMemo(() => {
    console.log('computing');
  }, []);
  return <div>{value}</div>;
}

```


## Error

```
  1 | // @enableValidateNoVoidUseMemo
  2 | function Component() {
> 3 |   const value = useMemo(() => {
    |                 ^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because useMemo doesn't return a value. useMemo should only be used for memoizing values, not running arbitrary side effects. (3:3)
  4 |     console.log('computing');
  5 |   }, []);
  6 |   return <div>{value}</div>;
```
          
      