
## Input

```javascript
// @enableValidateNoVoidUseMemo
function Component() {
  const value = useMemo(() => {
    console.log('computing');
  }, []);
  const value2 = React.useMemo(() => {
    console.log('computing');
  }, []);
  return (
    <div>
      {value}
      {value2}
    </div>
  );
}

```


## Error

```
Found 2 errors:

Error: React Compiler has skipped optimizing this component because useMemo doesn't return a value. useMemo should only be used for memoizing values, not running arbitrary side effects.

error.useMemo-no-return-value.ts:3:16
  1 | // @enableValidateNoVoidUseMemo
  2 | function Component() {
> 3 |   const value = useMemo(() => {
    |                 ^^^^^^^^^^^^^^^
> 4 |     console.log('computing');
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 5 |   }, []);
    | ^^^^^^^^^ React Compiler has skipped optimizing this component because useMemo doesn't return a value. useMemo should only be used for memoizing values, not running arbitrary side effects.
  6 |   const value2 = React.useMemo(() => {
  7 |     console.log('computing');
  8 |   }, []);

Error: React Compiler has skipped optimizing this component because React.useMemo doesn't return a value. useMemo should only be used for memoizing values, not running arbitrary side effects.

error.useMemo-no-return-value.ts:6:17
   4 |     console.log('computing');
   5 |   }, []);
>  6 |   const value2 = React.useMemo(() => {
     |                  ^^^^^^^^^^^^^^^^^^^^^
>  7 |     console.log('computing');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, []);
     | ^^^^^^^^^ React Compiler has skipped optimizing this component because React.useMemo doesn't return a value. useMemo should only be used for memoizing values, not running arbitrary side effects.
   9 |   return (
  10 |     <div>
  11 |       {value}
```
          
      