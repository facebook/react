
## Input

```javascript
// Test logical expression as part of optional chain base
function Component(props: {
  a: {x: {y: string} | null} | null;
  b: {x: {y: string}} | null;
}) {
  'use memo';
  return (props.a || props.b)?.x?.y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: null, b: {x: {y: 'found'}}}],
  sequentialRenders: [
    // a is null, uses b
    {a: null, b: {x: {y: 'found'}}},
    // a is truthy, uses a
    {a: {x: {y: 'first'}}, b: {x: {y: 'second'}}},
    // both null
    {a: null, b: null},
    // a is truthy but a.x is null
    {a: {x: null}, b: {x: {y: 'second'}}},
  ],
};

```

## Code

```javascript
// Test logical expression as part of optional chain base
function Component(props) {
  "use memo";
  return (props.a || props.b)?.x?.y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: null, b: { x: { y: "found" } } }],
  sequentialRenders: [
    // a is null, uses b
    { a: null, b: { x: { y: "found" } } },
    // a is truthy, uses a
    { a: { x: { y: "first" } }, b: { x: { y: "second" } } },
    // both null
    { a: null, b: null },
    // a is truthy but a.x is null
    { a: { x: null }, b: { x: { y: "second" } } },
  ],
};

```
      
### Eval output
(kind: ok) "found"
"first"

