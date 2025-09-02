// Test case to reproduce the bug
// This should NOT trigger ref validation error since we're accessing both ref and value
// from props, not a ref created by useRef

function Component(props) {
  // This should be allowed - we're accessing props, not using a ref
  const refValue = props.ref;
  const otherValue = props.value;
  
  // Using both should not trigger error
  return <div>{refValue} {otherValue}</div>;
}

// This should work with destructuring too
function ComponentDestructured({ref, value}) {
  return <div>{ref} {value}</div>;
}

export { Component, ComponentDestructured };
