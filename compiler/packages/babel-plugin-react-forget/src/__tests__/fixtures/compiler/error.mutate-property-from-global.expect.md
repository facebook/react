
## Input

```javascript
let wat = {};

function Foo() {
  delete wat.foo;
  return wat;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a variable after it was passed to React, which means that React cannot observe changes to it (4:4)
```
          
      