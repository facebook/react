
## Input

```javascript
function hoisting() {
  function addOne(b) {
    // a is undefined (only the declaration is hoisted, not the init) but shouldn't throw
    return a + b;
  }
  const result = addOne(2);
  var a = 1;

  return result; // OK: returns NaN. The code is semantically wrong but technically correct
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};

```


## Error

```
   5 |   }
   6 |   const result = addOne(2);
>  7 |   var a = 1;
     |   ^^^^^^^^^^ Todo: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration (7:7)
   8 |
   9 |   return result; // OK: returns NaN. The code is semantically wrong but technically correct
  10 | }
```
          
      