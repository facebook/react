
## Input

```javascript
/**
 * @flow strict-local
 * @format
 * @providesInline resize_plugin
 */
/*globals message, origin, __nativeHelper*/
(function () {
  // $FlowFixMe[incompatible-use]
  // $FlowFixMe[incompatible-use]
  if (x) {} else {
    // In iOS, we have to wait a minimum of time before trying to close the
    // window, this is most lightly related to the time it takes to animate the
    // tab change.
    var delay = x;
    if (delay) {
      x(function () {}, delay);
    } else {}
  }
})();

```


## Error

```
Found 1 error:

Todo: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration

error.bug-hir_structural_diff.ts:17:4
  15 |     // window, this is most lightly related to the time it takes to animate the
  16 |     // tab change.
> 17 |     var delay = x;
     |     ^^^^^^^^^^^^^^ (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
  18 |     if (delay) {
  19 |       x(function () {}, delay);
  20 |     } else {}
```
          
      