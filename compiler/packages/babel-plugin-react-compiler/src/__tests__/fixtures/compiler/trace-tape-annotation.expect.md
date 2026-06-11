
## Input

```javascript
// @compilationMode:"annotation" @enableEmitTraceTape

function Foo(props) {
  'use memo';
  'use trace tape';
  return <div title={props.title}>{props.count}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{title: 'hello', count: 3}],
};
```

## Code

```javascript
import {
  c as _c,
  experimental_createRenderTraceSession as _traceTapeSession,
  experimental_createTraceSelector as _traceTapeSelector,
} from "react/compiler-runtime"; // @compilationMode:"annotation" @enableEmitTraceTape

function Foo(props) {
  "use memo";
  "use trace tape";
  const $ = _c(3);
  let t0;
  if ($[0] !== props.count || $[1] !== props.title) {
    t0 = <div title={props.title}>{props.count}</div>;
    $[0] = props.count;
    $[1] = props.title;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
Foo.__traceTape = function () {
  return _traceTapeSession(function (trace, input) {
    trace.attr(
      "root",
      "title",
      [_traceTapeSelector("title", (input) => input.title)],
      (input) => input.title,
    );
    trace.text(
      "root.children.0",
      [_traceTapeSelector("count", (input) => input.count)],
      (input) => input.count,
    );
  });
};

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ title: "hello", count: 3 }],
};

```
      
### Eval output
(kind: ok) <div title="hello">3</div>