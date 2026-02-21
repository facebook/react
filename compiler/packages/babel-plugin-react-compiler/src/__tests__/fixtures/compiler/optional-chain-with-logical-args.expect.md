
## Input

```javascript
// Optional chain with logical expressions as args
function Component({a, b, c}) {
  return foo(a?.value ?? b, c?.value || 'default')?.result;
}

```

## Code

```javascript
// Optional chain with logical expressions as args
function Component(t0) {
  const { a, b, c } = t0;
  return foo(a?.value ?? b, c?.value || "default")?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented