
## Input

```javascript
function Component(props) {
  const items = props.items;
  const maxItems = props.maxItems;

  const renderedItems = [];
  const seen = new Set();
  const max = Math.max(0, maxItems);
  for (let i = 0; i < items.length; i += 1) {
    const item = items.at(i);
    if (item == null || seen.has(item)) {
      continue;
    }
    seen.add(item);
    renderedItems.push(<div>{item}</div>);
    if (renderedItems.length >= max) {
      break;
    }
  }
  const count = renderedItems.length;
  return (
    <div>
      <h1>{count} Items</h1>
      {renderedItems}
    </div>
  );
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  const items = props.items;
  const maxItems = props.maxItems;
  const c_0 = $[0] !== maxItems;
  const c_1 = $[1] !== items;
  let renderedItems;
  if (c_0 || c_1) {
    renderedItems = [];
    const seen = new Set();
    const max = Math.max(0, maxItems);
    for (let i = 0; i < items.length; i = i + 1, i) {
      const item = items.at(i);
      if (item == null || seen.has(item)) {
        continue;
      }

      seen.add(item);
      renderedItems.push(<div>{item}</div>);
      if (renderedItems.length >= max) {
        break;
      }
    }
    $[0] = maxItems;
    $[1] = items;
    $[2] = renderedItems;
  } else {
    renderedItems = $[2];
  }

  const count = renderedItems.length;
  return (
    <div>
      {<h1>{count} Items</h1>}
      {renderedItems}
    </div>
  );
}

```
      