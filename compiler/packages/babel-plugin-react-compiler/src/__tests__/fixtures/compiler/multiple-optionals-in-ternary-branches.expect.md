
## Input

```javascript
// Test optional chaining in both branches of a ternary
function Component(props: {a: {x: string} | null; b: {y: string} | null; cond: boolean}) {
  'use memo';
  return props.cond ? props.a?.x : props.b?.y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {x: 'hello'}, b: {y: 'world'}, cond: true}],
  sequentialRenders: [
    // cond=true, picks a?.x -> 'hello'
    {a: {x: 'hello'}, b: {y: 'world'}, cond: true},
    // cond=false, picks b?.y -> 'world'
    {a: {x: 'hello'}, b: {y: 'world'}, cond: false},
    // cond=true, a=null, picks a?.x -> undefined
    {a: null, b: {y: 'world'}, cond: true},
    // cond=false, b=null, picks b?.y -> undefined
    {a: {x: 'hello'}, b: null, cond: false},
  ],
};

```

## Code

```javascript
// Test optional chaining in both branches of a ternary
function Component(props) {
  "use memo";
  return props.cond ? props.a?.x : props.b?.y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { x: "hello" }, b: { y: "world" }, cond: true }],
  sequentialRenders: [
    // cond=true, picks a?.x -> 'hello'
    { a: { x: "hello" }, b: { y: "world" }, cond: true },
    // cond=false, picks b?.y -> 'world'
    { a: { x: "hello" }, b: { y: "world" }, cond: false },
    // cond=true, a=null, picks a?.x -> undefined
    { a: null, b: { y: "world" }, cond: true },
    // cond=false, b=null, picks b?.y -> undefined
    { a: { x: "hello" }, b: null, cond: false },
  ],
};

```
      
### Eval output
(kind: ok) "hello"
"world"

