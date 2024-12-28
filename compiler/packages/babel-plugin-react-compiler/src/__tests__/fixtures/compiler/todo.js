function Component() {
  let myObj = getObject();
  useFoo();
  // const cb = () => maybeMutate(myObj ?? []);
  const cb = () => (myObj = other());
  foo(cb);

  return myObj;
}
