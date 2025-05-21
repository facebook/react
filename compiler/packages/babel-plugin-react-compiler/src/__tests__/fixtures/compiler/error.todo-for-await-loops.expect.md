
## Input

```javascript
async function Component({items}) {
  const x = [];
  for await (const item of items) {
    x.push(item);
  }
  return x;
}

```


## Error

```
  1 | async function Component({items}) {
  2 |   const x = [];
> 3 |   for await (const item of items) {
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 4 |     x.push(item);
    | ^^^^^^^^^^^^^^^^^
> 5 |   }
    | ^^^^ Todo: (BuildHIR::lowerStatement) Handle for-await loops (3:5)
  6 |   return x;
  7 | }
  8 |
```
          
      