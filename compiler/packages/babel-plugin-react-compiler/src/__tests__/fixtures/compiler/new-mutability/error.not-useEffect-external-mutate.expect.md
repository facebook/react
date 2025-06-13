
## Input

```javascript
// @enableNewMutationAliasingModel
let x = {a: 42};

function Component(props) {
  foo(() => {
    x.a = 10;
    x.a = 20;
  });
}

```


## Error

```
  4 | function Component(props) {
  5 |   foo(() => {
> 6 |     x.a = 10;
    |     ^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (6:6)

InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (7:7)
  7 |     x.a = 20;
  8 |   });
  9 | }
```
          
      