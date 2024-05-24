
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

## Code

```javascript
function HomeDiscoStoreItemTileRating(props) {
  let count;
  count = 0;
  const item = useFragment();
  const aggregates = item?.aggregates || [];
  aggregates.forEach((aggregate) => {
    count = count + (aggregate.count || 0);
    count;
  });
  return <Text>{count}</Text>;
}

```
      