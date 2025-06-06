
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
  1 | function useFoo() {
  2 |   let x = 0;
> 3 |   return value => {
    |          ^^^^^^^^^^
> 4 |     x = value;
    | ^^^^^^^^^^^^^^
> 5 |   };
    | ^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (3:5)

InvalidReact: The function modifies a local variable here (4:4)
  6 | }
  7 |
```
          
      