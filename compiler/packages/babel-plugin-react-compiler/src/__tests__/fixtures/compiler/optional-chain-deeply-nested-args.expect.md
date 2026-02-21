
## Input

```javascript
// Deeply nested optional chains as args
function Component({a, b}) {
  return foo(a?.b?.c?.d, b?.e?.f?.g)?.result?.final;
}

```

## Code

```javascript
// Deeply nested optional chains as args
function Component(t0) {
  const { a, b } = t0;
  return foo(a?.b?.c?.d, b?.e?.f?.g)?.result?.final;
}

```
      
### Eval output
(kind: exception) Fixture not implemented