
## Input

```javascript
function Component() {
  const data = useData();
  const items = [];
  // NOTE: `i` is a context variable because it's reassigned and also referenced
  // within a closure, the `onClick` handler of each item
  for (let i = MIN; i <= MAX; i += INCREMENT) {
    items.push(<Stringify key={i} onClick={() => data.set(i)} />);
  }
  return items;
}

```


## Error

```
  4 |   // NOTE: `i` is a context variable because it's reassigned and also referenced
  5 |   // within a closure, the `onClick` handler of each item
> 6 |   for (let i = MIN; i <= MAX; i += INCREMENT) {
    |        ^^^^^^^^^^^ Todo: Support for loops where the index variable is a context variable. `i` is a context variable (6:6)
  7 |     items.push(<Stringify key={i} onClick={() => data.set(i)} />);
  8 |   }
  9 |   return items;
```
          
      