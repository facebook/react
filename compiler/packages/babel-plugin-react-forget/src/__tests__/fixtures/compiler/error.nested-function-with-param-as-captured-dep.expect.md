
## Input

```javascript
function Foo() {
  (function t() {
    let x = {};
    return function a(x = () => {}) {
      return x;
    };
  })();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Todo: (BuildHIR::node.lowerReorderableExpression) Expression type 'ArrowFunctionExpression' cannot be safely reordered (4:4)
```
          
      