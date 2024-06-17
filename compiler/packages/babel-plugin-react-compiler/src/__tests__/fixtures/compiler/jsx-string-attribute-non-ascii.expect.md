
## Input

```javascript
function Component() {
  return (
    <Post
      author="potetotes"
      text="in addition to understanding JavaScript semantics and the rules of React, the compiler team also understands தமிழ், 中文, 日本語, 한국어 and i think that’s pretty cool"
    />
  );
}

function Post({ author, text }) {
  return (
    <div>
      <h1>{author}</h1>
      <span>{text}</span>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Post
        author="potetotes"
        text={
          "in addition to understanding JavaScript semantics and the rules of React, the compiler team also understands \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD, \u4E2D\u6587, \u65E5\u672C\u8A9E, \uD55C\uAD6D\uC5B4 and i think that\u2019s pretty cool"
        }
      />
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function Post(t0) {
  const $ = _c(7);
  const { author, text } = t0;
  let t1;
  if ($[0] !== text) {
    t1 = <span>{text}</span>;
    $[0] = text;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== author) {
    t2 = <h1>{author}</h1>;
    $[2] = author;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t2 || $[5] !== t1) {
    t3 = (
      <div>
        {t2}
        {t1}
      </div>
    );
    $[4] = t2;
    $[5] = t1;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div><h1>potetotes</h1><span>in addition to understanding JavaScript semantics and the rules of React, the compiler team also understands தமிழ், 中文, 日本語, 한국어 and i think that’s pretty cool</span></div>