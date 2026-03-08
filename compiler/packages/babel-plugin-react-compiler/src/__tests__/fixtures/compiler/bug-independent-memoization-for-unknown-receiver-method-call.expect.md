
## Input

```javascript
function ExpensiveComponent({data, onClick}) {
  const processedData = expensiveProcessing(data);
  return (
    <ul>
      {processedData.map((item) => (
        <li key={item.id} onClick={() => onClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function ExpensiveComponent(t0) {
  const $ = _c(5);
  const {
    data,
    onClick
  } = t0;
  let t1;
  if ($[0] !== data) {
    t1 = expensiveProcessing(data);
    $[0] = data;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const processedData = t1;
  let t2;
  if ($[2] !== onClick || $[3] !== processedData) {
    t2 = <ul>{processedData.map(item => <li key={item.id} onClick={() => onClick(item)}>{item.name}</li>)}</ul>;
    $[2] = onClick;
    $[3] = processedData;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      