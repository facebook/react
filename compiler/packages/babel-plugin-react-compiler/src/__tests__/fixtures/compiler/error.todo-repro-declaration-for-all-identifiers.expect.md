
## Input

```javascript
function Foo() {
  try {
    // NOTE: this fixture previously failed during LeaveSSA;
    // double-check this code when supporting value blocks in try/catch
    for (let i = 0; i < 2; i++) {}
  } catch {}
}

```


## Error

```
Found 1 error:

Invariant: Expected a variable declaration

Got ExpressionStatement.

error.todo-repro-declaration-for-all-identifiers.ts:5:4
  3 |     // NOTE: this fixture previously failed during LeaveSSA;
  4 |     // double-check this code when supporting value blocks in try/catch
> 5 |     for (let i = 0; i < 2; i++) {}
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Expected a variable declaration
  6 |   } catch {}
  7 | }
  8 |
```
          
      