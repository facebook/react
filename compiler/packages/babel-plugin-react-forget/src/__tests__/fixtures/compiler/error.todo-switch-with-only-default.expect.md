
## Input

```javascript
function Component({ kind, ...props }) {
  switch (kind) {
    default:
      return <Stringify {...props} />;
  }
}

```


## Error

```
[ReactForget] Invariant: Expected trees to be at least 2 elements long.
```
          
      