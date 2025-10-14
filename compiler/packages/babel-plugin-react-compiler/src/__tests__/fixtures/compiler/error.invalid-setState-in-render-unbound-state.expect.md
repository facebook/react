
## Input

```javascript
function Component(props) {
  // Intentionally don't bind state, this repros a bug where we didn't
  // infer the type of destructured properties after a hole in the array
  let [, setState] = useState();
  setState(1);
  return props.foo;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```


## Error

```
Found 1 error:

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-setState-in-render-unbound-state.ts:5:2
  3 |   // infer the type of destructured properties after a hole in the array
  4 |   let [, setState] = useState();
> 5 |   setState(1);
    |   ^^^^^^^^ Found setState() in render
  6 |   return props.foo;
  7 | }
  8 |
```
          
      