
## Input

```javascript
function Component(props) {
  const cells = props.items.flatMap(item => [item, item.id + props.suffix]);
  return (
    <div>
      {cells.map((cell, i) => (
        <span key={i}>{typeof cell === 'object' ? cell.id : cell}</span>
      ))}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [{id: 1}, {id: 2}],
      suffix: '-x',
    },
  ],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(7);
  let t0;
  if ($[0] !== props.items || $[1] !== props.suffix) {
    let t1;
    if ($[3] !== props.suffix) {
      t1 = (item) => [item, item.id + props.suffix];
      $[3] = props.suffix;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const cells = props.items.flatMap(t1);
    t0 = cells.map(_temp);
    $[0] = props.items;
    $[1] = props.suffix;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  let t1;
  if ($[5] !== t0) {
    t1 = <div>{t0}</div>;
    $[5] = t0;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}
function _temp(cell, i) {
  return <span key={i}>{typeof cell === "object" ? cell.id : cell}</span>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [{ id: 1 }, { id: 2 }],
      suffix: "-x",
    },
  ],

  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>1</span><span>1-x</span><span>2</span><span>2-x</span></div>