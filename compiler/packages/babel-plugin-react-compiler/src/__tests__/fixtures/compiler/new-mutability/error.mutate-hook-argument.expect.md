
## Input

```javascript
// @enableNewMutationAliasingModel
function useHook(a, b) {
  b.test = 1;
  a.test = 2;
}

```


## Error

```
Found 2 errors:
Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

error.mutate-hook-argument.ts:3:2
  1 | // @enableNewMutationAliasingModel
  2 | function useHook(a, b) {
> 3 |   b.test = 1;
    |   ^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  4 |   a.test = 2;
  5 | }
  6 |


Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

error.mutate-hook-argument.ts:4:2
  2 | function useHook(a, b) {
  3 |   b.test = 1;
> 4 |   a.test = 2;
    |   ^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  5 | }
  6 |


```
          
      