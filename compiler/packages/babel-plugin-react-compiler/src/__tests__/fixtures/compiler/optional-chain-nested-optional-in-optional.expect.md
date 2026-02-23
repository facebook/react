
## Input

```javascript
// Nested optional chains: outer optional calling inner optional result
function Component({a, b}) {
  return foo(a?.bar?.baz, b?.qux)?.result;
}

```

## Code

```javascript
// Nested optional chains: outer optional calling inner optional result
function Component(t0) {
  const { a, b } = t0;
  return foo(a?.bar?.baz, b?.qux)?.result;
}

```
      
### Eval output
(kind: exception) Fixture not implemented