
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @loggerTestOnly

function Foo() {
  'use memo if(getTrue)';
  'use memo if(getFalse)';
  return <div>hello world</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
// @dynamicGating:{"source":"shared-runtime"} @panicThreshold:"none" @loggerTestOnly

function Foo() {
  "use memo if(getTrue)";
  "use memo if(getFalse)";
  return <div>hello world</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Logs

```
{"kind":"CompileError","fnLoc":{"start":{"line":3,"column":0,"index":88},"end":{"line":7,"column":1,"index":196},"filename":"dynamic-gating-invalid-multiple.ts"},"detail":{"options":{"category":"Gating","reason":"Multiple dynamic gating directives found","description":"Expected a single directive but found [use memo if(getTrue), use memo if(getFalse)]","suggestions":null,"loc":{"start":{"line":4,"column":2,"index":108},"end":{"line":4,"column":25,"index":131},"filename":"dynamic-gating-invalid-multiple.ts"}}}}
```
      
### Eval output
(kind: ok) <div>hello world</div>