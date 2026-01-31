
## Input

```javascript
function Component({a, b}) {
  return foo(a?.value, b?.value)?.result;
}

```

## Code

```javascript
function Component(t0) {
  const { a, b } = t0;
  return foo(a?.value, b?.value)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented