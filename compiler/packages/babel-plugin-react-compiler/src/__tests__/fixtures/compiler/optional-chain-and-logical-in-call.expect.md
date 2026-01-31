
## Input

```javascript
// Mix of optional chain and logical AND in call args
function Component({a, b, c}) {
  return foo(a?.value, b && b.value, c?.value)?.result;
}

```

## Code

```javascript
// Mix of optional chain and logical AND in call args
function Component(t0) {
  const { a, b, c } = t0;
  return foo(a?.value, b && b.value, c?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented