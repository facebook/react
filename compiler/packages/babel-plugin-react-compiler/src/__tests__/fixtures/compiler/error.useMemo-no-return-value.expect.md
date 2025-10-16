
## Input

```javascript
// @validateNoVoidUseMemo
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

Error: useMemo() callbacks must return a value

This useMemo() callback doesn't return a value. useMemo() is for computing and caching values, not for arbitrary side effects.

error.useMemo-no-return-value.ts:3:16
  1 | // @validateNoVoidUseMemo
  2 | function Component() {
> 3 |   const value = useMemo(() => {
    |                 ^^^^^^^^^^^^^^^
> 4 |     console.log('computing');
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 5 |   }, []);
    | ^^^^^^^^^ useMemo() callbacks must return a value
  6 |   const value2 = React.useMemo(() => {
  7 |     console.log('computing');
  8 |   }, []);

Error: useMemo() callbacks must return a value

This React.useMemo() callback doesn't return a value. useMemo() is for computing and caching values, not for arbitrary side effects.

error.useMemo-no-return-value.ts:6:17
   4 |     console.log('computing');
   5 |   }, []);
>  6 |   const value2 = React.useMemo(() => {
     |                  ^^^^^^^^^^^^^^^^^^^^^
>  7 |     console.log('computing');
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   }, []);
     | ^^^^^^^^^ useMemo() callbacks must return a value
   9 |   return (
  10 |     <div>
  11 |       {value}
```
          
      