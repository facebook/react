
## Input

```javascript
function Component(props) {
  let x = [];

  let _ = <Component x={x} />;

  // x is Frozen at this point
  x.push(props.p2);

  return <div>{_}</div>;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a global or a variable after it was passed to React, which means that React cannot observe changes to it (7:7)
```
          
      