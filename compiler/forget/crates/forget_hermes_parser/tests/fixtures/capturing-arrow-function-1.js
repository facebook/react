function component(a) {
  let z = { a };
  let x = () => {
    console.log(z);
  };
  return x;
}
