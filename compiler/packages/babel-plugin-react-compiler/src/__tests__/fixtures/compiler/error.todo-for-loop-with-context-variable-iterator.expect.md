
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
    |                               ^ InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX. Found mutation of `i` (6:6)
  7 |     items.push(<Stringify key={i} onClick={() => data.set(i)} />);
  8 |   }
  9 |   return items;
```
          
      