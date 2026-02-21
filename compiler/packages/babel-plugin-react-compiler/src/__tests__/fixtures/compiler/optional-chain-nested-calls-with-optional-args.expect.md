
## Input

```javascript
// Nested function calls with optional args at multiple levels
function Component({a, b, c}) {
  return outer(inner(a?.value, b?.value)?.mid, c?.value)?.result;
}

```

## Code

```javascript
// Nested function calls with optional args at multiple levels
function Component(t0) {
  const { a, b, c } = t0;
  return outer(inner(a?.value, b?.value)?.mid, c?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented