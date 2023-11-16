
## Input

```javascript
function Component(props) {
  const items = props.items.map((x) => x);
  const x = 42;
  return [x, items];
}

```


## Error

```
[ReactForget] Invariant: [hoisting] Expected value kind to be initialized. read x_0$13 (4:4)
```
          
      