
## Input

```javascript
function Component() {
  return get2();
  function get2() {
    return 2;
  }
}

```


## Error

```
  1 | function Component() {
  2 |   return get2();
> 3 |   function get2() {
    |   ^^^^^^^^^^^^^^^^^
> 4 |     return 2;
    | ^^^^^^^^^^^^^
> 5 |   }
    | ^^^^ Todo: Support functions with unreachable code that may contain hoisted declarations (3:5)
  6 | }
  7 |
```
          
      