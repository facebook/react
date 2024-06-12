
## Input

```javascript
function Component() {
  function callback(x) {
    if (x == 0) {
      return null;
    }
    return callback(x - 1);
  }
  return callback(10);
}

```


## Error

```
  4 |       return null;
  5 |     }
> 6 |     return callback(x - 1);
    |            ^^^^^^^^^^^^^^^ Todo: Unsupported declaration type for hoisting. variable "callback" declared with FunctionDeclaration (6:6)
  7 |   }
  8 |   return callback(10);
  9 | }
```
          
      