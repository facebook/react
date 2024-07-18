
## Input

```javascript
function Component(props) {
  const item = useFragment(graphql`...`, props.item);
  return item.items?.map((item) => renderItem(item)) ?? [];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  const item = useFragment(graphql`...`, props.item);
  let t0;
  if ($[0] !== item.items) {
    t0 = item.items?.map(_temp) ?? [];
    $[0] = item.items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
function _temp(item_0) {
  return renderItem(item_0);
}

```
      