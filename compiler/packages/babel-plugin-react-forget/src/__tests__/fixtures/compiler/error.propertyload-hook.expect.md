
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
    |             ^^^^^^^^^^ InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (2:2)

InvalidReact: Hooks may not be referenced as normal values, they must be called. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (3:3)
  3 |   return x();
  4 | }
  5 |
```
          
      