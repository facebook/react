
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
    |             ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Capitalized method calls may be calling components that use hooks, which make them dangerous to memoize. Ensure there are no hook calls in the function and rename it to begin with a lowercase letter to fix this error. SomeFunc may be a component. (3:3)
  4 |
  5 |   return x;
  6 | }
```
          
      