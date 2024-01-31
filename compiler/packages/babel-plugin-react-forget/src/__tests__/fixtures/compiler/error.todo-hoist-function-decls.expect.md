
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
[ReactForget] Todo: Unsupported declaration type for hoisting. variable "get2" declared with FunctionDeclaration (2:2)
```
          
      