
## Input

```javascript
//@flow

component Foo() {
  let x = {a: 1};
  x.a++;
  x.a--;
  console.log(++x.a);
  console.log(x.a++);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
function Foo() {
  const x = { a: 1 };
  x.a = x.a + 1;
  x.a = x.a - 1;
  console.log((x.a = x.a + 1));
  const t0 = x.a;
  x.a = t0 + 1;
  console.log(t0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
### Eval output
(kind: ok) 
logs: [2,2]