
## Input

```javascript
function Component(props) {
  let Component = Foo;

  Component = useMemo(() => {
    return Component;
  });

  return <Component />;
}

```


## Error

```
   6 |   });
   7 |
>  8 |   return <Component />;
     |           ^^^^^^^^^ [ReactForget] Invariant: Expected all references to a variable to be consistently local or context references. Identifier <unknown> Component$2 is referenced as a local variable, but was previously referenced as a context variable (8:8)
   9 | }
  10 |
```
          
      