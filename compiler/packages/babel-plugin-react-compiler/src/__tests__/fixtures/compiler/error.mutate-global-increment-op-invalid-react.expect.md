
## Input

```javascript
let renderCount = 0;

function NoHooks() {
  renderCount++;
  return <div />;
}

```


## Error

```
  2 |
  3 | function NoHooks() {
> 4 |   renderCount++;
    |   ^^^^^^^^^^^^^ Todo: (BuildHIR::lowerExpression) Support UpdateExpression where argument is a global (4:4)
  5 |   return <div />;
  6 | }
  7 |
```
          
      