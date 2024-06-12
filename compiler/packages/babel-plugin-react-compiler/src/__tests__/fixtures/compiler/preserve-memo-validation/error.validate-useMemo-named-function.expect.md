
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

// We technically do not need to bailout here if we can check
// `someHelper`'s reactive deps are a subset of depslist from
// source. This check is somewhat incompatible with our current
// representation of manual memoization in HIR, so we bail out
// for now.
function Component(props) {
  const x = useMemo(someHelper, []);
  return x;
}

```


## Error

```
   7 | // for now.
   8 | function Component(props) {
>  9 |   const x = useMemo(someHelper, []);
     |                     ^^^^^^^^^^ InvalidReact: Expected the first argument to be an inline function expression (9:9)
  10 |   return x;
  11 | }
  12 |
```
          
      