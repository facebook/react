
## Input

```javascript
function Component(props) {
  let x;
  try {
    throw [];
  } catch (e) {
    x.push(e);
  }
  return x;
}

```


## Error

```
  2 |   let x;
  3 |   try {
> 4 |     throw [];
    |     ^^^^^^^^^ Todo: (BuildHIR::lowerStatement) Support ThrowStatement inside of try/catch (4:4)
  5 |   } catch (e) {
  6 |     x.push(e);
  7 |   }
```
          
      