
## Input

```javascript
import { identity } from "shared-runtime";

function Component(statusName) {
  // status is local, text is a scope declaration
  const { status, text } = foo(statusName);
  // color is local, font is a scope declaration
  const { color, font } = getStyles(status);
  // bg is a declaration
  const bg = identity(color);
  return (
    <div className={bg}>
      <span className={font}>{[text]}</span>
    </div>
  );
}
function foo(name) {
  return {
    status: `<status>`,
    text: `${name}!`,
  };
}

function getStyles(status) {
  return {
    font: "comic-sans",
    color: "#657b83",
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["Sathya"],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function Component(statusName) {
  const $ = _c(6);
  let t0;
  let text;
  let font;
  if ($[0] !== statusName) {
    const { status, text: t1 } = foo(statusName);
    text = t1;

    const { color, font: t2 } = getStyles(status);
    font = t2;

    t0 = identity(color);
    $[0] = statusName;
    $[1] = t0;
    $[2] = text;
    $[3] = font;
  } else {
    t0 = $[1];
    text = $[2];
    font = $[3];
  }
  const bg = t0;
  let t1;
  if ($[4] !== text) {
    t1 = (
      <div className={bg}>
        <span className={font}>{[text]}</span>
      </div>
    );
    $[4] = text;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

function foo(name) {
  const $ = _c(2);

  const t0 = `${name}!`;
  let t1;
  if ($[0] !== t0) {
    t1 = { status: `<status>`, text: t0 };
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

function getStyles(status) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { font: "comic-sans", color: "#657b83" };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["Sathya"],
};

```
      
### Eval output
(kind: ok) <div class="#657b83"><span class="comic-sans">Sathya!</span></div>