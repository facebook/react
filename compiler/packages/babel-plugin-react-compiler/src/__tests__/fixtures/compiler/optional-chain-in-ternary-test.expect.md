
## Input

```javascript
// Optional chain in ternary condition
function Component({a, b, c}) {
  return foo(a?.value, b?.value) ? c?.result : null;
}

```

## Code

```javascript
// Optional chain in ternary condition
function Component(t0) {
  const { a, b, c } = t0;
  return foo(a?.value, b?.value) ? c?.result : null;
}

```
      
### Eval output
(kind: exception) Fixture not implemented