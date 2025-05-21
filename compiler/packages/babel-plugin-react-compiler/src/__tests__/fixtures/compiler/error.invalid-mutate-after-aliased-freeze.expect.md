
## Input

```javascript
function Component(props) {
  let x = [];
  let y = x;

  if (props.p1) {
    x = [];
  }

  let _ = <Component x={x} />;

  // y is MaybeFrozen at this point, since it may alias to x
  // (which is the above line freezes)
  y.push(props.p2);

  return <Component x={x} y={y} />;
}

```


## Error

```
  11 |   // y is MaybeFrozen at this point, since it may alias to x
  12 |   // (which is the above line freezes)
> 13 |   y.push(props.p2);
     |   ^ InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX (13:13)
  14 |
  15 |   return <Component x={x} y={y} />;
  16 | }
```
          
      