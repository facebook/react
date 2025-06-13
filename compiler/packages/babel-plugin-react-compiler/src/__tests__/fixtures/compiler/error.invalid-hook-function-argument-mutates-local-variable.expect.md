
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions

function useFoo() {
  const cache = new Map();
  useHook(() => {
    cache.set('key', 'value');
  });
}

```


## Error

```
  3 | function useFoo() {
  4 |   const cache = new Map();
> 5 |   useHook(() => {
    |           ^^^^^^^
> 6 |     cache.set('key', 'value');
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 7 |   });
    | ^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (5:7)

InvalidReact: The function modifies a local variable here (6:6)
  8 | }
  9 |
```
          
      