
## Input

```javascript
function Component(props) {
  // This `x` uses a context variable:
  const items = props.items.filter((x) => x != null);
  // and so does this one:
  const x = items.map((y) => y);
  // I think what's happening is that `x` is both a) used in a function expression and b) "reassigned",
  // meeting the criteria for context variables. Except that these are different instances of x.
  return x;
}

```


## Error

```
[ReactForget] Invariant: Expected value kind to be initialized at '8:9:8:10' (8:8)
```
          
      