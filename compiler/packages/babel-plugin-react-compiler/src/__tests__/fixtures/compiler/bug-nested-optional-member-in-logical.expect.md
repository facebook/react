
## Input

```javascript
function Component({a, b}) {
  'use memo';
  return useHook(a?.value, b?.value) ?? {};
}

```

## Code

```javascript
function Component(t0) {
  "use memo";
  const { a, b } = t0;

  return useHook(a?.value, b?.value) ?? {};
}

```
      
### Eval output
(kind: exception) Fixture not implemented