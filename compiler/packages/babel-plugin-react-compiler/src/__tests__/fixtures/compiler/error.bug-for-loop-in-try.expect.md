
## Input

```javascript
function Foo({items}) {
  const results = [];
  try {
    for (let i = 0; i < items.length; i++) {
      results.push(items[i]);
    }
  } catch (e) {
    return <span>Error</span>;
  }
  return <span>{results.join(', ')}</span>;
}

```


## Error

```
Found 1 error:

Invariant: Expected a variable declaration

Got ExpressionStatement.

error.bug-for-loop-in-try.ts:4:4
  2 |   const results = [];
  3 |   try {
> 4 |     for (let i = 0; i < items.length; i++) {
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 5 |       results.push(items[i]);
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 6 |     }
    | ^^^^^^ Expected a variable declaration
  7 |   } catch (e) {
  8 |     return <span>Error</span>;
  9 |   }
```
          
      