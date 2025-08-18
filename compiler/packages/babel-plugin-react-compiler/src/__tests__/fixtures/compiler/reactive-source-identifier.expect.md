
## Input

```javascript
// @reactiveSourceIdentifiers:["reactiveSource"]
function reactiveSource() {
  console.log('reactiveSource');
}

function Component({prop}) {
  const value1 = reactiveSource();
  const value2 = reactiveSource(value);
  const value3 = prop > 0.5 ? reactiveSource() : null;
  return (
    <div>
      {value1}
      {value2}
      {value3}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @reactiveSourceIdentifiers:["reactiveSource"]
function reactiveSource() {
  console.log("reactiveSource");
}

function Component(t0) {
  const $ = _c(4);
  const { prop } = t0;
  const value1 = reactiveSource();
  const value2 = reactiveSource(value);
  const value3 = prop > 0.5 ? reactiveSource() : null;
  let t1;
  if ($[0] !== value1 || $[1] !== value2 || $[2] !== value3) {
    t1 = (
      <div>
        {value1}
        {value2}
        {value3}
      </div>
    );
    $[0] = value1;
    $[1] = value2;
    $[2] = value3;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prop: 1 }],
  isComponent: true,
};

```
      
### Eval output
(kind: exception) value is not defined
logs: ['reactiveSource','reactiveSource']