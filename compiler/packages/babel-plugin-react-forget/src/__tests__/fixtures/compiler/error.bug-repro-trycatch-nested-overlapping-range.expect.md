
## Input

```javascript
function Foo() {
  try {
    let thing = null;
    if (cond) {
      thing = makeObject();
    }
    if (otherCond) {
      mutate(thing);
    }
  } catch {}
}

```


## Error

```
Invariant: Invalid nesting in program blocks or scopes. Blocks overlap but are not nested: Scope@0(2:24) ProgramBlockSubtree@17(18:26)
```
          
      