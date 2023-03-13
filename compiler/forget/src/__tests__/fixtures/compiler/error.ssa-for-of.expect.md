
## Input

```javascript
function foo(cond) {
  let items = [];
  for (const item of items) {
    let y = 0;
    if (cond) {
      y = 1;
    }
  }
  return items;
}

```


## Error

```
[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  1 | function foo(cond) {
  2 |   let items = [];
> 3 |   for (const item of items) {
    |   ^
  4 |     let y = 0;
  5 |     if (cond) {
  6 |       y = 1;
```
          
      