
## Input

```javascript
// Test optional chaining inside logical AND (&&)
function Component(props: {value: {x: string} | null; enabled: boolean}) {
  'use memo';
  const value = props.value;
  return props.enabled && value?.x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: {x: 'hello'}, enabled: true}],
  sequentialRenders: [
    {value: {x: 'hello'}, enabled: true},
    {value: {x: 'hello'}, enabled: false},
    {value: null, enabled: true},
    {value: {x: 'world'}, enabled: true},
  ],
};

```

## Code

```javascript
// Test optional chaining inside logical AND (&&)
function Component(props) {
  "use memo";

  const value = props.value;
  return props.enabled && value?.x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { x: "hello" }, enabled: true }],
  sequentialRenders: [
    { value: { x: "hello" }, enabled: true },
    { value: { x: "hello" }, enabled: false },
    { value: null, enabled: true },
    { value: { x: "world" }, enabled: true },
  ],
};

```
      
### Eval output
(kind: ok) "hello"
false

"world"