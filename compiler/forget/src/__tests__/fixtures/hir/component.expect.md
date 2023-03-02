
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
  const $ = React.unstable_useMemoCache(10);
  const items = props.items;
  const maxItems = props.maxItems;
  const c_0 = $[0] !== maxItems;
  const c_1 = $[1] !== items;
  let renderedItems;
  if (c_0 || c_1) {
    renderedItems = [];
    const seen = new Set();
    const c_3 = $[3] !== maxItems;
    let t0;
    if (c_3) {
      t0 = Math.max(0, maxItems);
      $[3] = maxItems;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    const max = t0;
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
  let t1;
  if (c_5) {
    t1 = <h1>{count} Items</h1>;
    $[5] = count;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  const c_7 = $[7] !== t1;
  const c_8 = $[8] !== renderedItems;
  let t2;
  if (c_7 || c_8) {
    t2 = (
      <div>
        {t1}
        {renderedItems}
      </div>
    );
    $[7] = t1;
    $[8] = renderedItems;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
}

```
      