
## Input

```javascript
function useHook(a, b) {
  b.test = 1;
  a.test = 2;
}

```


## Error

```
Found 2 errors:
Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

error.mutate-hook-argument.ts:2:2
  1 | function useHook(a, b) {
> 2 |   b.test = 1;
    |   ^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  3 |   a.test = 2;
  4 | }
  5 |


Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

error.mutate-hook-argument.ts:3:2
  1 | function useHook(a, b) {
  2 |   b.test = 1;
> 3 |   a.test = 2;
    |   ^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  4 | }
  5 |


```
          
      