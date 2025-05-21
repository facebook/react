
## Input

```javascript
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
  3 | function Component(props) {
  4 |   foo(() => {
> 5 |     x.a = 10;
    |     ^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (5:5)
  6 |     x.a = 20;
  7 |   });
  8 | }
```
          
      