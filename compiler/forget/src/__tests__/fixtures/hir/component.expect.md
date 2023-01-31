
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
  const $ = React.useMemoCache();
  const items = props.items;
  const maxItems = props.maxItems;
  const c_0 = $[0] !== maxItems;
  const c_1 = $[1] !== items;
  let renderedItems;
  if (c_0 || c_1) {
    renderedItems = [];
    const seen = new Set();
    const c_3 = $[3] !== maxItems;
    let max;
    if (c_3) {
      max = Math.max(0, maxItems);
      $[3] = maxItems;
      $[4] = max;
    } else {
      max = $[4];
    }
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
  const c_5 = $[5] !== count;
  let t6;
  if (c_5) {
    t6 = <h1>{count} Items</h1>;
    $[5] = count;
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  const c_7 = $[7] !== t6;
  const c_8 = $[8] !== renderedItems;
  let t9;
  if (c_7 || c_8) {
    t9 = (
      <div>
        {t6}
        {renderedItems}
      </div>
    );
    $[7] = t6;
    $[8] = renderedItems;
    $[9] = t9;
  } else {
    t9 = $[9];
  }
  return t9;
}

```
      