// @skip
// Passed but should have errored

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function renderItem() {
  useState();
}

function List(props) {
  return props.items.map(renderItem);
}
