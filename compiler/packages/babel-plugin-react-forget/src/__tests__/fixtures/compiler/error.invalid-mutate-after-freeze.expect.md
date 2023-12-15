
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
[ReactForget] InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX. (7:7)
```
          
      