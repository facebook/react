
## Input

```javascript
let wat = {};

function Foo() {
  wat.test = 1;
  return wat;
}

```


## Error

```
  2 |
  3 | function Foo() {
> 4 |   wat.test = 1;
    |   ^^^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (4:4)
  5 |   return wat;
  6 | }
  7 |
```
          
      