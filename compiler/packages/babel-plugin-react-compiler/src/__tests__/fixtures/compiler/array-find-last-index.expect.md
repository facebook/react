
## Input

```javascript
function Component() {
  const array = ['c', 'b', 'a'];
  return useMemo(() => {
    return array.findLastIndex('b');
  }, [array]);
}

```

## Code

```javascript
function Component() {
  const array = ["c", "b", "a"];
  let t0;

  t0 = array.findLastIndex("b");
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented