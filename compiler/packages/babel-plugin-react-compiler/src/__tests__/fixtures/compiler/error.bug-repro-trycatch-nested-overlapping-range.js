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
