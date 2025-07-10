
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
Error: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead

Variable `x` cannot be reassigned after render.

error.invalid-reassign-local-in-hook-return-value.ts:4:4
  2 |   let x = 0;
  3 |   return value => {
> 4 |     x = value;
    |     ^ Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead
  5 |   };
  6 | }
  7 |


```
          
      