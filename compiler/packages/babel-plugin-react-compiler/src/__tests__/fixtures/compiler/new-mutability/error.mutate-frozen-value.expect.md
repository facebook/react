
## Input

```javascript
// @enableNewMutationAliasingModel
function Component({a, b}) {
  const x = {a};
  useFreeze(x);
  x.y = true;
  return <div>error</div>;
}

```


## Error

```
  3 |   const x = {a};
  4 |   useFreeze(x);
> 5 |   x.y = true;
    |   ^ InvalidReact: This mutates a variable that React considers immutable (5:5)
  6 |   return <div>error</div>;
  7 | }
  8 |
```
          
      