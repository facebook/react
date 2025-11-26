
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
  params: [],
  isComponent: true,
};

```

## Code

```javascript
function Component(props) {
  const [, setState] = useState();
  setState(1);
  return props.foo;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: exception) useState is not defined