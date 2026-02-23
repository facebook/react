
## Input

```javascript
// Three optional chain arguments
function Component({a, b, c}) {
  return foo(a?.value, b?.value, c?.value)?.result;
}

```

## Code

```javascript
// Three optional chain arguments
function Component(t0) {
  const { a, b, c } = t0;
  return foo(a?.value, b?.value, c?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented