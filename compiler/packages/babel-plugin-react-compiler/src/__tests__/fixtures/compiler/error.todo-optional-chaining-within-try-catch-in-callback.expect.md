
## Input

```javascript
function Component(props) {
  const callback = async () => {
    try {
      const result = await fetch(props.url);
      return result?.error;
    } catch (e) {
      return null;
    }
  };
  return callback;
}

```


## Error

```
Found 1 error:

Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement

error.todo-optional-chaining-within-try-catch-in-callback.ts:5:13
  3 |     try {
  4 |       const result = await fetch(props.url);
> 5 |       return result?.error;
    |              ^^^^^^ Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement
  6 |     } catch (e) {
  7 |       return null;
  8 |     }
```
          
      