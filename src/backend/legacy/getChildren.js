// @flow

export default function getChildren(internalInstance: Object): Array<any> {
  // If the parent is a native node without rendered children, but with
  // multiple string children, then the `element` that gets passed in here is
  // a plain value -- a string or number.
  if (internalInstance._renderedComponent) {
    return [internalInstance._renderedComponent];
  } else if (internalInstance._renderedChildren) {
    return childrenToArray(internalInstance._renderedChildren);
  } else if (
    internalInstance._currentElement &&
    internalInstance._currentElement.props
  ) {
    // DevTools doesn't need to display primative child types,
    // So we can filter them out early.
    /*
    const children = [];

    // This is a native node without rendered children -- meaning the children
    // prop is the unfiltered list of children.
    // This may include 'null' or even other invalid values, so we need to
    // filter it the same way that ReactDOM does.
    // Instead of pulling in the whole React library, we just copied over the
    // 'traverseAllChildrenImpl' method.
    // https://github.com/facebook/react/blob/240b84ed8e1db715d759afaae85033718a0b24e1/src/isomorphic/children/ReactChildren.js#L112-L158
    const unfilteredChildren = internalInstance._currentElement.props.children;
    traverseAllChildrenImpl(
      unfilteredChildren,
      '', // nameSoFar
      (_traverseContext, child) => {
        const childType = typeof child;
        if (childType === 'string' || childType === 'number') {
          children.push(child);
        }
      }
      // traverseContext
    );

    return children;
    */
  }

  if (internalInstance._instance) {
    var inst = internalInstance._instance;
    // TODO: React ART currently falls in this bucket, but this doesn't
    // actually make sense and we should clean this up after stabilizing our
    // API for backends
    if (inst._renderedChildren) {
      return childrenToArray(inst._renderedChildren);
    }
  }

  return [];
}

function childrenToArray(children) {
  const array = [];
  for (var name in children) {
    array.push(children[name]);
  }
  return array;
}
