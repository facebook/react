
## Input

```javascript
function Component(props) {
  // b is an object, must be memoized even though the input is not memoized
  const { a, ...b } = props.a;
  // d is an array, mut be memoized even though the input is not memoized
  const [c, ...d] = props.c;
  return <div b={b} d={d}></div>;
}

```


## Error

```
[ReactForget] Invariant: Encountered a destructuring operation where some identifiers are already declared (reassignments) but others are not (declarations) (3:3)
```
          
      