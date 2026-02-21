
## Input

```javascript
// Ternary with optional chains in both branches
function Component({a, b, cond}) {
  return foo(cond ? a?.value : b?.value)?.result;
}

```

## Code

```javascript
// Ternary with optional chains in both branches
function Component(t0) {
  const { a, b, cond } = t0;
  return foo(cond ? a?.value : b?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented