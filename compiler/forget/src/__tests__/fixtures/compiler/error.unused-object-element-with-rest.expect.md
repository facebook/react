
## Input

```javascript
function Foo(props) {
  // can't remove `unused` since it affects which properties are copied into `rest`
  const { unused, ...rest } = props.a;
  return rest;
}

```


## Error

```
[ReactForget] Invariant: Encountered a destructuring operation where some identifiers are already declared (reassignments) but others are not (declarations) (3:3)
```
          
      