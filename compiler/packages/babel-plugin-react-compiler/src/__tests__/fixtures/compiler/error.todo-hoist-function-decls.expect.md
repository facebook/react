
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
> 2 |   return get2();
    |          ^^^^^^ Todo: Unsupported declaration type for hoisting. variable "get2" declared with FunctionDeclaration (2:2)
  3 |   function get2() {
  4 |     return 2;
  5 |   }
```
          
      