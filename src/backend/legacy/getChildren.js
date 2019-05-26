// @flow

import traverseAllChildrenImpl from './traverseAllChildrenImpl';

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
  } else if (
    internalInstance._currentElement &&
    internalInstance._currentElement.props
  ) {
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
    );
  }

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
