
## Input

```javascript
function Component(props) {
  const callback = () => {
    try {
      return [];
    } catch (e) {
      return;
    }
  };
  return callback();
}

```


## Error

```
[ReactForget] Invariant: Expected temporaries to be promoted to named identifiers in an earlier pass. identifier 16 is unnamed
```
          
      