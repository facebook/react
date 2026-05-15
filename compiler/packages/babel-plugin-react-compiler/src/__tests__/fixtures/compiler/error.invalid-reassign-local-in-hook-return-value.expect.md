
## Input

```javascript
function useFoo() {
  let x = 0;
  return value => {
    x = value;
  };
}

```


## Error

```
Found 1 error:

Error: Cannot reassign variable after render completes

Reassigning `x` after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead.

error.invalid-reassign-local-in-hook-return-value.ts:4:4
  2 |   let x = 0;
  3 |   return value => {
> 4 |     x = value;
    |     ^ Cannot reassign `x` after render completes
  5 |   };
  6 | }
  7 |
```
          
      