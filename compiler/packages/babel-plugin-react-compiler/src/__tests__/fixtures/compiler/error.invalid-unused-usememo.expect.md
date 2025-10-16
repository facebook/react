
## Input

```javascript
// @validateNoVoidUseMemo
function Component() {
  useMemo(() => {
    return [];
  }, []);
  return <div />;
}

```


## Error

```
Found 1 error:

Error: Unused useMemo()

This useMemo() value is unused. useMemo() is for computing and caching values, not for arbitrary side effects.

error.invalid-unused-usememo.ts:3:2
  1 | // @validateNoVoidUseMemo
  2 | function Component() {
> 3 |   useMemo(() => {
    |   ^^^^^^^ useMemo() result is unused
  4 |     return [];
  5 |   }, []);
  6 |   return <div />;
```
          
      