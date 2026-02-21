
## Input

```javascript
// Short-circuit logical with multiple optional chains
function Component({a, b, c}) {
  return a?.value && foo(b?.value, c?.value)?.result;
}

```

## Code

```javascript
// Short-circuit logical with multiple optional chains
function Component(t0) {
  const { a, b, c } = t0;
  return a?.value && foo(b?.value, c?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented