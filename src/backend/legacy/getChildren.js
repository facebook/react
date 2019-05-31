// @flow

// TODO (legacy) Respect component filters

export default function getChildren(internalInstance: Object): Array<any> {
  let children = [];

  // If the parent is a native node without rendered children, but with
  // multiple string children, then the `element` that gets passed in here is
  // a plain value -- a string or number.
  if (typeof internalInstance !== 'object') {
    // No children
  } else if (
    internalInstance._currentElement === null ||
    internalInstance._currentElement === false
  ) {
    // No children
  } else if (internalInstance._renderedComponent) {
    children = [internalInstance._renderedComponent];
  } else if (internalInstance._renderedChildren) {
    children = renderedChildrenToArray(internalInstance._renderedChildren);
  }
  // Note: we skip the case where children are just strings or numbers
  // because the new DevTools skips over host text nodes anyway.

  const instance = internalInstance._instance;
  if (instance) {
    // TODO: React ART currently falls in this bucket, but this doesn't
    // actually make sense and we should clean this up after stabilizing our
    // API for backends
    if (instance._renderedChildren) {
      children = renderedChildrenToArray(instance._renderedChildren);
    }
  }

  return children;
}

function renderedChildrenToArray(renderedChildren): Array<any> {
  const childrenArray = [];
  for (let name in renderedChildren) {
    childrenArray.push(renderedChildren[name]);
  }
  return childrenArray;
}
