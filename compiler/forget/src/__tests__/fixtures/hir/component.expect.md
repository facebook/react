
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
  const c_1 = $[1] !== items.length;
  const c_2 = $[2] !== items.at;
  let renderedItems;
  if (c_0 || c_1 || c_2) {
    renderedItems = [];
    const seen = new Set();
    const c_4 = $[4] !== maxItems;
    let max;

    if (c_4) {
      max = Math.max(0, maxItems);
      $[4] = maxItems;
      $[5] = max;
    } else {
      max = $[5];
    }

    for (let i = 0; i < items.length; i = i + 1, i) {
      const item = items.at(i);

      if (item == null) {
      } else {
      }

      if (seen.has(item)) {
        continue;
      }

      seen.add(item);
      renderedItems.push(<div>{item}</div>);

      if (renderedItems.length >= max) {
        break;
      }
    }

    $[0] = maxItems;
    $[1] = items.length;
    $[2] = items.at;
    $[3] = renderedItems;
  } else {
    renderedItems = $[3];
  }

  const count = renderedItems.length;
  const c_6 = $[6] !== count;
  let t7;

  if (c_6) {
    t7 = <h1>{count} Items</h1>;
    $[6] = count;
    $[7] = t7;
  } else {
    t7 = $[7];
  }

  const c_8 = $[8] !== t7;
  const c_9 = $[9] !== renderedItems;
  let t10;

  if (c_8 || c_9) {
    t10 = (
      <div>
        {t7}
        {renderedItems}
      </div>
    );
    $[8] = t7;
    $[9] = renderedItems;
    $[10] = t10;
  } else {
    t10 = $[10];
  }

  return t10;
}

```
      