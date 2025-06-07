
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
  2 |   let x = 0;
  3 |   return value => {
> 4 |     x = value;
    |     ^ InvalidReact: Reassigning a variable after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead. Variable `x` cannot be reassigned after render (4:4)
  5 |   };
  6 | }
  7 |
```
          
      