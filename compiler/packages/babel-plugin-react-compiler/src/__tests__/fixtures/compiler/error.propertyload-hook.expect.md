
## Input

```javascript
function Component() {
  const x = Foo.useFoo;
  return x();
}

```


## Error

```
  1 | function Component() {
> 2 |   const x = Foo.useFoo;
    |             ^^^^^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (2:2)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values (3:3)
  3 |   return x();
  4 | }
  5 |
```
          
      