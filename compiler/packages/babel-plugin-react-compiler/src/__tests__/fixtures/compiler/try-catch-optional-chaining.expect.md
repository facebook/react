
## Input

```javascript
function Foo({json}) {
  try {
    const foo = JSON.parse(json)?.foo;
    return <span>{foo}</span>;
  } catch {
    return null;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{json: '{"foo": "hello"}'}],
  sequentialRenders: [
    {json: '{"foo": "hello"}'},
    {json: '{"foo": "hello"}'},
    {json: '{"foo": "world"}'},
    {json: '{"bar": "no foo"}'},
    {json: '{}'},
    {json: 'invalid json'},
    {json: '{"foo": 42}'},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Foo(t0) {
  const $ = _c(2);
  const { json } = t0;
  try {
    const foo = JSON.parse(json)?.foo;
    let t1;
    if ($[0] !== foo) {
      t1 = <span>{foo}</span>;
      $[0] = foo;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    return t1;
  } catch {
    return null;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ json: '{"foo": "hello"}' }],
  sequentialRenders: [
    { json: '{"foo": "hello"}' },
    { json: '{"foo": "hello"}' },
    { json: '{"foo": "world"}' },
    { json: '{"bar": "no foo"}' },
    { json: "{}" },
    { json: "invalid json" },
    { json: '{"foo": 42}' },
  ],
};

```
      
### Eval output
(kind: ok) <span>hello</span>
<span>hello</span>
<span>world</span>
<span></span>
<span></span>
null
<span>42</span>