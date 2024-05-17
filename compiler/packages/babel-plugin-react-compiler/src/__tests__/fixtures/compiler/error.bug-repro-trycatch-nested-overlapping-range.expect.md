
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
Invariant: Invalid nesting in program blocks or scopes. Items overlap but are not nested: 2:24(18:26)
```
          
      