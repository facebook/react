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
