
## Input

```javascript
// @validateNoFreezingKnownMutableFunctions
function Component() {
  const cache = new Map();
  const fn = () => {
    cache.set('key', 'value');
  };
  return <Foo fn={fn} />;
}

```


## Error

```
Found 2 errors:
Error: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead

error.invalid-pass-mutable-function-as-prop.ts:7:18
  5 |     cache.set('key', 'value');
  6 |   };
> 7 |   return <Foo fn={fn} />;
    |                   ^^ This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead
  8 | }
  9 |


Error: The function modifies a local variable here

error.invalid-pass-mutable-function-as-prop.ts:5:4
  3 |   const cache = new Map();
  4 |   const fn = () => {
> 5 |     cache.set('key', 'value');
    |     ^^^^^ The function modifies a local variable here
  6 |   };
  7 |   return <Foo fn={fn} />;
  8 | }


```
          
      