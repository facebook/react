
## Input

```javascript
const View = React.memo(({items}) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const View = React.memo((t0) => {
  const $ = _c(4);
  const { items } = t0;
  let t1;
  if ($[0] !== items) {
    t1 = items.map(_temp);
    $[0] = items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = <ul>{t1}</ul>;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
});
function _temp(item) {
  return <li key={item.id}>{item.name}</li>;
}

```
      
### Eval output
(kind: exception) Fixture not implemented