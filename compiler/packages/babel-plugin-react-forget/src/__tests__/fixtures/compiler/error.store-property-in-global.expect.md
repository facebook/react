
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
[ReactForget] InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect. (4:4)
```
          
      