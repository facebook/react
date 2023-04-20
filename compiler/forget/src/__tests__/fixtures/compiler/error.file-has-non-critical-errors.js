// @panicOnBailout false
function Bad() {
  var x = 1;
  return <div>{x}</div>;
}

function Good() {
  const x = 1;
  return <div>{x}</div>;
}
