
## Input

```javascript
function HomeDiscoStoreItemTileRating(props) {
  const item = useFragment();
  let count = 0;
  const aggregates = item?.aggregates || [];
  aggregates.forEach((aggregate) => {
    count += aggregate.count || 0;
  });

  return <Text>{count}</Text>;
}

```


## Error

```
[ReactForget] Invariant: Expected all references to a variable to be consistently local or context references. Identifier <unknown> count$6 is referenced as a local variable, but was previously referenced as a context variable (6:6)
```
          
      