
## Input

```javascript
// Test deeply nested: optional in ternary condition with logical fallback
function Component(props: {
  value: {flag: boolean; data: string} | null;
  fallback: string;
}) {
  'use memo';
  const value = props.value;
  return (value?.flag ? value?.data : null) ?? props.fallback;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: {flag: true, data: 'success'}, fallback: 'default'}],
  sequentialRenders: [
    // flag true, returns data
    {value: {flag: true, data: 'success'}, fallback: 'default'},
    // flag false, ternary returns null, falls back
    {value: {flag: false, data: 'success'}, fallback: 'default'},
    // value is null, value?.flag is undefined/falsy, ternary returns null, falls back
    {value: null, fallback: 'default'},
    // different data value
    {value: {flag: true, data: 'other'}, fallback: 'default'},
  ],
};

```

## Code

```javascript
// Test deeply nested: optional in ternary condition with logical fallback
function Component(props) {
  "use memo";

  const value = props.value;
  return (value?.flag ? value?.data : null) ?? props.fallback;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { flag: true, data: "success" }, fallback: "default" }],
  sequentialRenders: [
    // flag true, returns data
    { value: { flag: true, data: "success" }, fallback: "default" },
    // flag false, ternary returns null, falls back
    { value: { flag: false, data: "success" }, fallback: "default" },
    // value is null, value?.flag is undefined/falsy, ternary returns null, falls back
    { value: null, fallback: "default" },
    // different data value
    { value: { flag: true, data: "other" }, fallback: "default" },
  ],
};

```
      
### Eval output
(kind: ok) "success"
"default"
"default"
"other"