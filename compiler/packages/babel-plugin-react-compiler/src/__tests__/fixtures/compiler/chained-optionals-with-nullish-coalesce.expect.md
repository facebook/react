
## Input

```javascript
// Test chained optional property access with nullish coalescing
function Component(props: {obj: {a?: {b?: {c: string}}} | null}) {
  'use memo';
  return props.obj?.a?.b?.c ?? 'default';
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: {a: {b: {c: 'deep'}}}}],
  sequentialRenders: [
    {obj: {a: {b: {c: 'deep'}}}},
    {obj: null},
    {obj: {a: null}},
    {obj: {a: {b: null}}},
    {obj: {a: {b: {c: 'other'}}}},
  ],
};

```

## Code

```javascript
// Test chained optional property access with nullish coalescing
function Component(props) {
  "use memo";
  return props.obj?.a?.b?.c ?? "default";
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ obj: { a: { b: { c: "deep" } } } }],
  sequentialRenders: [
    { obj: { a: { b: { c: "deep" } } } },
    { obj: null },
    { obj: { a: null } },
    { obj: { a: { b: null } } },
    { obj: { a: { b: { c: "other" } } } },
  ],
};

```
      
### Eval output
(kind: ok) "deep"
"default"
"default"
"default"
"other"