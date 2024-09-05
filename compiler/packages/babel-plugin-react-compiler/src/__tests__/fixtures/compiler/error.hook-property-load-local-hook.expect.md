
## Input

```javascript
function useFoo() {}
useFoo.useBar = function () {
  return 'foo';
};

function Foo() {
  let bar = useFoo.useBar;
  return bar();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```


## Error

```
   5 |
   6 | function Foo() {
>  7 |   let bar = useFoo.useBar;
     |             ^^^^^^^^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (7:7)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (8:8)
   8 |   return bar();
   9 | }
  10 |
```
          
      