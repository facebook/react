
## Input

```javascript
const Symbol = '<symbol>';
function Component({text}) {
  return <div>{Symbol + text}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{text: 'hello'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const Symbol = "<symbol>";
function Component(t0) {
  const $ = _c(2);
  const { text } = t0;
  const t1 = Symbol + text;
  let t2;
  if ($[0] !== t1) {
    t2 = <div>{t1}</div>;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ text: "hello" }],
};

```
      
### Eval output
(kind: ok) <div>&lt;symbol&gt;hello</div>