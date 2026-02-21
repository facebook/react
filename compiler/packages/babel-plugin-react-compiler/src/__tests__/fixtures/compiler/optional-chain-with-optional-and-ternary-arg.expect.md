
## Input

```javascript
// Optional chain with ternary and optional args
function Component({a, b, cond}) {
  return foo(a?.value, cond ? b : null)?.result;
}

```

## Code

```javascript
// Optional chain with ternary and optional args
function Component(t0) {
  const { a, b, cond } = t0;
  return foo(a?.value, cond ? b : null)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented