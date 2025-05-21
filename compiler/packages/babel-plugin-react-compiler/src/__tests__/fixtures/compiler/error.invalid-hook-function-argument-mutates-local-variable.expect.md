
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
    | ^^^^ InvalidReact: This argument is a function which modifies local variables when called, which can bypass memoization and cause the UI not to update. Functions that are returned from hooks, passed as arguments to hooks, or passed as props to components may not mutate local variables (5:7)

InvalidReact: The function modifies a local variable here (6:6)
  8 | }
  9 |
```
          
      