
## Input

```javascript
function Component(props) {
  const items = [];
  for (const x of props.items) {
    x.modified = true;
    items.push(x);
  }
  return items;
}

```


## Error

```
Found 1 error:
Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

error.invalid-mutate-props-via-for-of-iterator.ts:4:4
  2 |   const items = [];
  3 |   for (const x of props.items) {
> 4 |     x.modified = true;
    |     ^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  5 |     items.push(x);
  6 |   }
  7 |   return items;


```
          
      