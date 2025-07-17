
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
Found 2 errors:
Error: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead

error.invalid-hook-function-argument-mutates-local-variable.ts:5:10
  3 | function useFoo() {
  4 |   const cache = new Map();
> 5 |   useHook(() => {
    |           ^^^^^^^
> 6 |     cache.set('key', 'value');
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 7 |   });
    | ^^^^ This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead
  8 | }
  9 |


Error: The function modifies a local variable here

error.invalid-hook-function-argument-mutates-local-variable.ts:6:4
  4 |   const cache = new Map();
  5 |   useHook(() => {
> 6 |     cache.set('key', 'value');
    |     ^^^^^ The function modifies a local variable here
  7 |   });
  8 | }
  9 |


```
          
      