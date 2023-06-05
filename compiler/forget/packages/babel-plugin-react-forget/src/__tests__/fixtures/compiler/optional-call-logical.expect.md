
## Input

```javascript
function Component(props) {
  const item = useFragment(graphql`...`, props.item);
  return item.items?.map((item) => renderItem(item)) ?? [];
}

```

## Code

```javascript
function Component(props) {
  const item = useFragment(graphql`...`, props.item);
  return item.items?.map((item_0) => renderItem(item_0)) ?? [];
}

```
      