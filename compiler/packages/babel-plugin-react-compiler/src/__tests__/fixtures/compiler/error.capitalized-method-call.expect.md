
## Input

```javascript
// @validateNoCapitalizedCalls
function Component() {
  const x = someGlobal.SomeFunc();

  return x;
}

```


## Error

```
  1 | // @validateNoCapitalizedCalls
  2 | function Component() {
> 3 |   const x = someGlobal.SomeFunc();
    |             ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Capitalized functions are reserved for components, which must be invoked with JSX. If this is a component, render it with JSX. Otherwise, ensure that it has no hook calls and rename it to begin with a lowercase letter. SomeFunc may be a component. (3:3)
  4 |
  5 |   return x;
  6 | }
```
          
      